"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Family, Caregiver } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  family: Family | null;
  caregiver: Caregiver | null;
  loading: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: any }>;
  signUpWithPhone: (
    phone: string,
    password: string,
    name: string,
    familyName: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do usuário (família e cuidador)
  const loadUserData = async (userId: string, retryCount = 0) => {
    try {
      // Buscar cuidador
      const { data: caregiverData, error: caregiverError } = await supabase
        .from("caregivers")
        .select("*")
        .eq("id", userId)
        .single();

      if (caregiverError) {
        console.error("Erro ao carregar cuidador:", caregiverError);
        // Retry em caso de erro de rede
        if (retryCount < 2 && caregiverError.message?.includes("network")) {
          setTimeout(() => loadUserData(userId, retryCount + 1), 1000);
        }
        return;
      }

      setCaregiver(caregiverData);

      // Buscar família
      if (caregiverData?.family_id) {
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("*")
          .eq("id", caregiverData.family_id)
          .single();

        if (!familyError && familyData) {
          setFamily(familyData);
        } else {
          console.error("Erro ao carregar família:", familyError);
        }
      }
    } catch (error) {
      console.error("Erro geral ao carregar dados do usuário:", error);
      // Retry em caso de erro inesperado
      if (retryCount < 2) {
        setTimeout(() => loadUserData(userId, retryCount + 1), 1000);
      }
    }
  };

  // Atualizar dados do usuário
  const refreshUserData = async () => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  };

  // Verificar sessão inicial
  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
        } else {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user?.id) {
            await loadUserData(session.user.id);
          } else {
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await loadUserData(session.user.id);
      } else {
        setFamily(null);
        setCaregiver(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login com telefone e senha
  const signInWithPhone = async (phone: string, password: string) => {
    try {
      // Primeiro, verificar se existe um cuidador com esse telefone
      const { data: caregiverData, error: caregiverError } = await supabase
        .from("caregivers")
        .select("*")
        .eq("phone", phone)
        .single();

      if (caregiverError || !caregiverData) {
        return {
          error: {
            message:
              "Telefone não encontrado. Verifique o número ou cadastre-se.",
          },
        };
      }

      // Verificar se o cuidador tem email armazenado
      if (!caregiverData.email) {
        return {
          error: {
            message:
              "Conta antiga detectada. Entre em contato com o suporte para migração.",
          },
        };
      }

      // Tentar fazer login usando o email armazenado
      const { error } = await supabase.auth.signInWithPassword({
        email: caregiverData.email,
        password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  // Cadastro com telefone e senha
  const signUpWithPhone = async (
    phone: string,
    password: string,
    name: string,
    familyName: string
  ) => {
    try {
      // Verificar se o telefone já existe
      const { data: existingCaregiver } = await supabase
        .from("caregivers")
        .select("phone")
        .eq("phone", phone)
        .single();

      if (existingCaregiver) {
        return {
          error: {
            message:
              "Este telefone já está cadastrado. Faça login ou use outro número.",
          },
        };
      }

      // Verificar se a família já existe
      let familyId: string;
      const { data: existingFamily } = await supabase
        .from("families")
        .select("id")
        .eq("phone", phone)
        .single();

      if (existingFamily) {
        familyId = existingFamily.id;
      } else {
        // Criar nova família
        const { data: newFamily, error: familyError } = await supabase
          .from("families")
          .insert({
            name: familyName,
            phone: phone,
          })
          .select()
          .single();

        if (familyError || !newFamily) {
          return { error: familyError };
        }

        familyId = newFamily.id;
      }

      // Criar conta no Supabase Auth usando UUID como email
      const tempUserId = crypto.randomUUID();
      const email = `${tempUserId}@babybot.app`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });

      if (authError || !authData.user) {
        return { error: authError };
      }

      // Criar cuidador com o ID do usuário auth
      const { error: caregiverError } = await supabase
        .from("caregivers")
        .insert({
          id: authData.user.id,
          family_id: familyId,
          name,
          phone,
          email, // Armazenar o email usado na autenticação
          relationship: "responsavel",
          is_primary: true,
        });

      if (caregiverError) {
        // Se falhar ao criar cuidador, deletar usuário auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { error: caregiverError };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Logout
  const signOut = async () => {
    try {
      // Limpar estado local primeiro
      setUser(null);
      setSession(null);
      setFamily(null);
      setCaregiver(null);

      // Depois fazer logout no Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro durante logout:", error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setFamily(null);
      setCaregiver(null);
    }
  };

  const value = {
    user,
    session,
    family,
    caregiver,
    loading,
    signInWithPhone,
    signUpWithPhone,
    signOut,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
