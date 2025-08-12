"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

dayjs.locale("pt-br");

export type PeriodFilter = "day" | "week" | "month";
export type ChartType = "line" | "bar";

interface EvolutionChartProps {
  title: string;
  data: any[];
  babies: Array<{ id: string; name: string }>;
  selectedBaby: string;
  onBabyChange: (babyId: string) => void;
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  chartType?: ChartType;
  dataProcessor: (data: any[], period: PeriodFilter) => {
    labels: string[];
    datasets: any[];
  };
  yAxisLabel: string;
  loading?: boolean;
}

export default function EvolutionChart({
  title,
  data,
  babies,
  selectedBaby,
  onBabyChange,
  periodFilter,
  onPeriodChange,
  chartType = "line",
  dataProcessor,
  yAxisLabel,
  loading = false,
}: EvolutionChartProps) {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (data.length > 0) {
      const processedData = dataProcessor(data, periodFilter);
      setChartData(processedData);
    }
  }, [data, periodFilter, dataProcessor]);

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: getPeriodLabel(periodFilter),
        },
        grid: {
          display: true,
          color: "rgba(0,0,0,0.1)",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0,0,0,0.1)",
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  function getPeriodLabel(period: PeriodFilter): string {
    switch (period) {
      case "day":
        return "Últimos 7 dias";
      case "week":
        return "Últimas 4 semanas";
      case "month":
        return "Últimos 6 meses";
      default:
        return "";
    }
  }

  const ChartComponent = chartType === "line" ? Line : Bar;

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Box sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography color="text.secondary">Carregando dados...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom>
              📊 {title}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {/* Seletor de Bebê */}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Bebê</InputLabel>
                <Select
                  value={selectedBaby}
                  onChange={(e) => onBabyChange(e.target.value)}
                  label="Bebê"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {babies.map((baby) => (
                    <MenuItem key={baby.id} value={baby.id}>
                      {baby.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Filtro de Período */}
              <ToggleButtonGroup
                value={periodFilter}
                exclusive
                onChange={(_, newPeriod) => newPeriod && onPeriodChange(newPeriod)}
                size="small"
              >
                <ToggleButton value="day">7 Dias</ToggleButton>
                <ToggleButton value="week">4 Semanas</ToggleButton>
                <ToggleButton value="month">6 Meses</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ height: 400, position: "relative" }}>
          {chartData.labels.length > 0 ? (
            <ChartComponent data={chartData} options={chartOptions} />
          ) : (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography color="text.secondary">
                Nenhum dado encontrado para o período selecionado
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
