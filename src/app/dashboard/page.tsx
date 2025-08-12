"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Alert,
  Skeleton,
  Container,
  IconButton,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  ChildCare as Baby,
  Bedtime,
  Restaurant,
  DirectionsWalk,
  Height,
  TrendingUp,
  Refresh,
  Timeline,
  FavoriteOutlined,
  LocalDining,
  BarChart,
  TrendingUpRounded,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Baby as BabyType } from "@/lib/supabase";

interface BabyWithStatus extends BabyType {
  current_status?: string;
  last_feeding?: string;
  hours_since_feeding?: number;
  current_weight?: number;
  current_height?: number;
}

interface DashboardStats {
  totalBabies: number;
  totalCaregivers: number;
  todayFeedings: number;
  todaySleepHours: number;
  todayWalks: number;
}

export default function DashboardPage() {
  const { family, caregiver } = useAuth();
  const [babies, setBabies] = useState<BabyWithStatus[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, [family]);

  const loadDashboardData = async () => {
    if (!family) return;

    try {
      setLoading(true);
      setError("");

      // Carregar bebês
      const { data: babiesData, error: babiesError } = await supabase
        .from("babies")
        .select("*")
        .eq("family_id", family.id)
        .eq("is_active", true);

      if (babiesError) throw babiesError;

      // Carregar status atual de cada bebê
      const babiesWithStatus = await Promise.all(
        (babiesData || []).map(async (baby) => {
          try {
            // Status atual
            const { data: statusData } = await supabase.rpc(
              "baby_current_status",
              { baby_uuid: baby.id }
            );

            // Última medição de crescimento
            const { data: growthData } = await supabase.rpc(
              "get_latest_growth",
              { baby_uuid: baby.id }
            );

            return {
              ...baby,
              current_status: statusData?.[0]?.current_status,
              last_feeding: statusData?.[0]?.last_feeding,
              hours_since_feeding: statusData?.[0]?.hours_since_last_feeding,
              current_weight: growthData?.[0]?.weight_grams,
              current_height: growthData?.[0]?.height_cm,
            };
          } catch (error) {
            return baby;
          }
        })
      );

      setBabies(babiesWithStatus);

      // Carregar estatísticas
      const today = new Date().toISOString().split("T")[0];

      // Contar cuidadores
      const { count: caregiversCount } = await supabase
        .from("caregivers")
        .select("*", { count: "exact", head: true })
        .eq("family_id", family.id);

      // Estatísticas apenas se houver bebês
      let feedingsCount = 0;
      let walksCount = 0;

      if (babiesData && babiesData.length > 0) {
        // Alimentações hoje
        const { count: feedingsResult } = await supabase
          .from("feeding_records")
          .select("*", { count: "exact", head: true })
          .eq("baby_id", babiesData[0].id)
          .gte("feeding_time", `${today}T00:00:00Z`)
          .lt("feeding_time", `${today}T23:59:59Z`);

        // Passeios hoje
        const { count: walksResult } = await supabase
          .from("walk_records")
          .select("*", { count: "exact", head: true })
          .eq("baby_id", babiesData[0].id)
          .gte("walk_start", `${today}T00:00:00Z`)
          .lt("walk_start", `${today}T23:59:59Z`);

        feedingsCount = feedingsResult || 0;
        walksCount = walksResult || 0;
      }

      // Horas de sono hoje
      let sleepHours = 0;
      if (babiesData?.[0]) {
        const { data: sleepData } = await supabase.rpc("daily_sleep_report", {
          baby_uuid: babiesData[0].id,
          report_date: today,
        });

        sleepHours = Math.round(
          (sleepData?.[0]?.total_sleep_minutes || 0) / 60
        );
      }

      setStats({
        totalBabies: babiesData?.length || 0,
        totalCaregivers: caregiversCount || 0,
        todayFeedings: feedingsCount,
        todaySleepHours: sleepHours,
        todayWalks: walksCount,
      });
    } catch (error) {
      setError("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Dormindo":
        return "info";
      case "Passeando":
        return "success";
      case "Acordado em casa":
        return "default";
      default:
        return "default";
    }
  };

  const getAgeInDays = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Bem-vindo, {caregiver?.name}! 👋
        </Typography>

        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Simplified Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo, {caregiver?.name}! Acompanhe o desenvolvimento dos seus
          pequenos
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Simplified Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 48, height: 48 }}
                  >
                    <Baby />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {stats.totalBabies}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bebês
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "info.main", width: 48, height: 48 }}>
                    <Bedtime />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {stats.todaySleepHours}h
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sono hoje
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{ bgcolor: "success.main", width: 48, height: 48 }}
                  >
                    <Restaurant />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {stats.todayFeedings}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Refeições hoje
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{ bgcolor: "warning.main", width: 48, height: 48 }}
                  >
                    <DirectionsWalk />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {stats.todayWalks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Passeios hoje
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 4 }}>
        Seus Bebês
      </Typography>

      {babies.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Baby sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Nenhum bebê cadastrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adicione seu primeiro bebê para começar a acompanhar seu
              desenvolvimento
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {babies.map((baby) => (
            <Grid item xs={12} md={6} lg={4} key={baby.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: "secondary.main",
                        mr: 2,
                        width: 56,
                        height: 56,
                      }}
                    >
                      <Baby sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {baby.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getAgeInDays(baby.birth_date)} dias de vida
                      </Typography>
                    </Box>
                    {baby.current_status && (
                      <Chip
                        label={baby.current_status}
                        size="small"
                        color={getStatusColor(baby.current_status) as any}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 2,
                    }}
                  >
                    {baby.current_weight && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Height
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {(baby.current_weight / 1000).toFixed(1)}kg
                        </Typography>
                      </Box>
                    )}

                    {baby.current_height && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <TrendingUp
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {baby.current_height}cm
                        </Typography>
                      </Box>
                    )}

                    {baby.hours_since_feeding && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Restaurant
                          sx={{ fontSize: 16, mr: 1, color: "text.secondary" }}
                        />
                        <Typography variant="body2">
                          {baby.hours_since_feeding.toFixed(1)}h atrás
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
