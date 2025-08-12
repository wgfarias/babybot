import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UsePageDataOptions {
  // Função que carrega os dados
  loadData: () => Promise<void>;
  // Dependências adicionais além de family
  dependencies?: any[];
  // Se deve tentar recarregar automaticamente em caso de erro
  autoRetry?: boolean;
  // Delay antes do retry (em ms)
  retryDelay?: number;
  // Número máximo de tentativas
  maxRetries?: number;
}

export function usePageData({
  loadData,
  dependencies = [],
  autoRetry = true,
  retryDelay = 2000,
  maxRetries = 3,
}: UsePageDataOptions) {
  const { family, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [retryCount, setRetryCount] = useState(0);

  const executeLoad = useCallback(async () => {
    // Se ainda estiver carregando autenticação, aguardar
    if (authLoading) return;

    // Se não há usuário autenticado, não tentar carregar
    if (!user) {
      setLoading(false);
      return;
    }

    // Se não há família ainda, aguardar um pouco mais
    if (!family) {
      // Dar mais tempo para o family carregar, mas sem mostrar como "erro"
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 800); // Aumentei o tempo para dar mais chance da auth carregar
      } else {
        setError(
          "Não foi possível carregar os dados da família. Tente fazer login novamente."
        );
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError("");
      await loadData();
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error("Erro ao carregar dados da página:", err);
      const errorMessage = err.message || "Erro ao carregar dados";

      // Se é um erro de rede, ser mais específico
      if (errorMessage.includes("fetch") || errorMessage.includes("network")) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        setError(errorMessage);
      }

      // Auto retry se habilitado
      if (autoRetry && retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [
    family,
    user,
    authLoading,
    loadData,
    retryCount,
    maxRetries,
    autoRetry,
    retryDelay,
  ]);

  // Função para tentar novamente manualmente
  const retry = useCallback(() => {
    setRetryCount(0);
    executeLoad();
  }, [executeLoad]);

  // Effect principal
  useEffect(() => {
    executeLoad();
  }, [family, user, authLoading, retryCount, ...dependencies]);

  return {
    loading,
    error,
    retry,
    isRetrying: retryCount > 0,
    retryCount,
  };
}
