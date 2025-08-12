"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Add,
  Height,
  Edit,
  Delete,
  Scale,
  Straighten,
  AccountCircle,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  TrendingUp,
  Assessment,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Baby } from "@/lib/supabase";

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

dayjs.locale("pt-br");

interface GrowthRecord {
  id: string;
  baby_id: string;
  caregiver_id: string;
  weight_grams: number;
  height_cm: number;
  head_circumference_cm: number;
  measurement_date: string;
  measurement_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface GrowthRecordWithRelations extends GrowthRecord {
  baby_name: string;
  caregiver_name: string;
  age_days: number;
  weight_kg: number;
}

interface GrowthFormData {
  baby_id: string;
  measurement_date: dayjs.Dayjs | null;
  weight_grams: string;
  height_cm: string;
  head_circumference_cm: string;
  measurement_location: string;
  notes: string;
}

const measurementLocations = [
  { value: "casa", label: "Casa" },
  { value: "pediatra", label: "Pediatra" },
  { value: "hospital", label: "Hospital" },
  { value: "posto_saude", label: "Posto de Saúde" },
  { value: "nascimento", label: "Nascimento" },
  { value: "outros", label: "Outros" },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`growth-tabpanel-${index}`}
      aria-labelledby={`growth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function GrowthPage() {
  const { family, caregiver } = useAuth();
  const [growthRecords, setGrowthRecords] = useState<
    GrowthRecordWithRelations[]
  >([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<GrowthRecordWithRelations | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedBabyForChart, setSelectedBabyForChart] = useState<string>("");
  const [formData, setFormData] = useState<GrowthFormData>({
    baby_id: "",
    measurement_date: null,
    weight_grams: "",
    height_cm: "",
    head_circumference_cm: "",
    measurement_location: "",
    notes: "",
  });

  // Estados para modal de confirmação e snackbar
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  useEffect(() => {
    if (family) {
      loadBabies();
      loadGrowthRecords();
    }
  }, [family]);

  // Funções para snackbar
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Funções para modal de confirmação
  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      handleDelete(recordToDelete);
    }
    setConfirmDialogOpen(false);
    setRecordToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setRecordToDelete(null);
  };

  const loadBabies = async () => {
    if (!family) return;

    try {
      const { data, error } = await supabase
        .from("babies")
        .select("*")
        .eq("family_id", family.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBabies(data || []);

      // Selecionar primeiro bebê para o gráfico se não houver seleção
      if (data && data.length > 0 && !selectedBabyForChart) {
        setSelectedBabyForChart(data[0].id);
      }
    } catch (error: any) {
      setError("Erro ao carregar bebês");
    }
  };

  const loadGrowthRecords = async () => {
    if (!family) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("growth_records")
        .select(
          `
          *,
          babies!growth_records_baby_id_fkey(name, birth_date),
          caregivers!growth_records_caregiver_id_fkey(name)
        `
        )
        .eq("babies.family_id", family.id)
        .order("measurement_date", { ascending: false });

      if (error) throw error;

      const recordsWithRelations = (data || []).map((record: any) => {
        const birthDate = dayjs(record.babies?.birth_date);
        const measurementDate = dayjs(record.measurement_date);
        const ageDays = measurementDate.diff(birthDate, "days");

        return {
          ...record,
          baby_name: record.babies?.name || "Bebê não encontrado",
          caregiver_name: record.caregivers?.name || "Cuidador não encontrado",
          age_days: ageDays,
          weight_kg: record.weight_grams / 1000,
        };
      });

      setGrowthRecords(recordsWithRelations);
    } catch (error: any) {
      setError("Erro ao carregar registros de crescimento");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (record?: GrowthRecordWithRelations) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        baby_id: record.baby_id,
        measurement_date: dayjs(record.measurement_date),
        weight_grams: record.weight_grams.toString(),
        height_cm: record.height_cm.toString(),
        head_circumference_cm: record.head_circumference_cm.toString(),
        measurement_location: record.measurement_location || "",
        notes: record.notes || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        baby_id: babies[0]?.id || "",
        measurement_date: dayjs(),
        weight_grams: "",
        height_cm: "",
        head_circumference_cm: "",
        measurement_location: "",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
    setFormData({
      baby_id: "",
      measurement_date: null,
      weight_grams: "",
      height_cm: "",
      head_circumference_cm: "",
      measurement_location: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (
      !caregiver ||
      !formData.baby_id ||
      !formData.measurement_date ||
      !formData.weight_grams
    ) {
      setError("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      const growthData: any = {
        baby_id: formData.baby_id,
        caregiver_id: caregiver.id,
        measurement_date: formData.measurement_date.format("YYYY-MM-DD"),
        weight_grams: parseInt(formData.weight_grams),
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        head_circumference_cm: formData.head_circumference_cm
          ? parseFloat(formData.head_circumference_cm)
          : null,
        measurement_location: formData.measurement_location || null,
        notes: formData.notes || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from("growth_records")
          .update(growthData)
          .eq("id", editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("growth_records")
          .insert(growthData);

        if (error) throw error;
      }

      handleCloseDialog();
      showSnackbar(
        editingRecord
          ? "Registro atualizado com sucesso!"
          : "Registro criado com sucesso!",
        "success"
      );
      loadGrowthRecords();
    } catch (error: any) {
      setError(error.message || "Erro ao salvar registro");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      setLoading(true);

      const { error, data } = await supabase
        .from("growth_records")
        .delete()
        .eq("id", recordId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        showSnackbar("Nenhum registro foi encontrado para exclusão", "warning");
        return;
      }

      showSnackbar("Registro excluído com sucesso!", "success");
      loadGrowthRecords();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao excluir registro", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Preparar dados para os gráficos
  const getChartData = () => {
    if (!selectedBabyForChart) return null;

    const babyRecords = growthRecords
      .filter((record) => record.baby_id === selectedBabyForChart)
      .sort(
        (a, b) =>
          dayjs(a.measurement_date).valueOf() -
          dayjs(b.measurement_date).valueOf()
      );

    if (babyRecords.length === 0) return null;

    const labels = babyRecords.map((record) =>
      dayjs(record.measurement_date).format("DD/MM/YYYY")
    );

    const weightData = babyRecords.map((record) => record.weight_kg);
    const heightData = babyRecords.map((record) => record.height_cm);
    const headCircumferenceData = babyRecords.map(
      (record) => record.head_circumference_cm
    );

    return {
      labels,
      weightData,
      heightData,
      headCircumferenceData,
      babyRecords,
    };
  };

  const chartData = getChartData();

  // Configurações dos gráficos
  const weightChartData = chartData
    ? {
        labels: chartData.labels,
        datasets: [
          {
            label: "Peso (kg)",
            data: chartData.weightData,
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            tension: 0.1,
          },
        ],
      }
    : null;

  const heightChartData = chartData
    ? {
        labels: chartData.labels,
        datasets: [
          {
            label: "Altura (cm)",
            data: chartData.heightData,
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            tension: 0.1,
          },
        ],
      }
    : null;

  const headCircumferenceChartData = chartData
    ? {
        labels: chartData.labels,
        datasets: [
          {
            label: "Perímetro Cefálico (cm)",
            data: chartData.headCircumferenceData,
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            tension: 0.1,
          },
        ],
      }
    : null;

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  const getLatestMeasurement = (babyId: string) => {
    const babyRecords = growthRecords
      .filter((record) => record.baby_id === babyId)
      .sort(
        (a, b) =>
          dayjs(b.measurement_date).valueOf() -
          dayjs(a.measurement_date).valueOf()
      );

    return babyRecords[0] || null;
  };

  if (loading && growthRecords.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Crescimento
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Adicionar Medição
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Cards com últimas medições */}
        {babies.length > 0 && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {babies.map((baby) => {
              const latestMeasurement = getLatestMeasurement(baby.id);
              return (
                <Grid item xs={12} md={6} lg={4} key={baby.id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <Height />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">{baby.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {dayjs().diff(dayjs(baby.birth_date), "days")} dias
                            de vida
                          </Typography>
                        </Box>
                      </Box>

                      {latestMeasurement ? (
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Última medição:</strong>{" "}
                            {dayjs(latestMeasurement.measurement_date).format(
                              "DD/MM/YYYY"
                            )}
                          </Typography>
                          <Box
                            sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}
                          >
                            <Box sx={{ textAlign: "center" }}>
                              <Typography variant="h6" color="primary">
                                {latestMeasurement.weight_kg.toFixed(1)}kg
                              </Typography>
                              <Typography variant="caption">Peso</Typography>
                            </Box>
                            {latestMeasurement.height_cm && (
                              <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h6" color="secondary">
                                  {latestMeasurement.height_cm}cm
                                </Typography>
                                <Typography variant="caption">
                                  Altura
                                </Typography>
                              </Box>
                            )}
                            {latestMeasurement.head_circumference_cm && (
                              <Box sx={{ textAlign: "center" }}>
                                <Typography variant="h6" color="info.main">
                                  {latestMeasurement.head_circumference_cm}cm
                                </Typography>
                                <Typography variant="caption">
                                  P. Cefálico
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Nenhuma medição registrada
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Tabs para alternar entre tabela e gráficos */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs value={selectedTab} onChange={handleTabChange}>
            <Tab
              label="Histórico de Medições"
              icon={<Assessment />}
              iconPosition="start"
            />
            <Tab
              label="Gráficos de Evolução"
              icon={<TrendingUp />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Aba 1: Histórico de medições */}
        <TabPanel value={selectedTab} index={0}>
          {growthRecords.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <Height sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhum registro de crescimento
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Comece registrando as medições dos seus bebês
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  Primeira Medição
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bebê</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Idade</TableCell>
                    <TableCell>Peso</TableCell>
                    <TableCell>Altura</TableCell>
                    <TableCell>P. Cefálico</TableCell>
                    <TableCell>Local</TableCell>
                    <TableCell>Cuidador</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {growthRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              width: 32,
                              height: 32,
                            }}
                          >
                            <Height sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="subtitle2">
                            {record.baby_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(record.measurement_date).format("DD/MM/YYYY")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.age_days} dias
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="primary"
                        >
                          {record.weight_kg.toFixed(1)}kg
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.height_cm ? `${record.height_cm}cm` : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.head_circumference_cm
                            ? `${record.head_circumference_cm}cm`
                            : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {record.measurement_location || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {record.caregiver_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleOpenDialog(record)}
                          size="small"
                          disabled={loading}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteClick(record.id)}
                          size="small"
                          color="error"
                          disabled={loading}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Aba 2: Gráficos de evolução */}
        <TabPanel value={selectedTab} index={1}>
          {babies.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Selecione o bebê</InputLabel>
                <Select
                  value={selectedBabyForChart}
                  onChange={(e) => setSelectedBabyForChart(e.target.value)}
                  label="Selecione o bebê"
                >
                  {babies.map((baby) => (
                    <MenuItem key={baby.id} value={baby.id}>
                      {baby.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {chartData && chartData.babyRecords.length > 0 ? (
            <Grid container spacing={3}>
              {/* Gráfico de Peso */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Scale color="primary" />
                      Evolução do Peso
                    </Typography>
                    {weightChartData && (
                      <Line options={chartOptions} data={weightChartData} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Altura */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Straighten color="secondary" />
                      Evolução da Altura
                    </Typography>
                    {heightChartData && (
                      <Line options={chartOptions} data={heightChartData} />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Perímetro Cefálico */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AccountCircle color="info" />
                      Evolução do Perímetro Cefálico
                    </Typography>
                    {headCircumferenceChartData && (
                      <Line
                        options={chartOptions}
                        data={headCircumferenceChartData}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Estatísticas */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Estatísticas
                    </Typography>
                    {chartData.babyRecords.length >= 2 && (
                      <Box>
                        {(() => {
                          const firstRecord = chartData.babyRecords[0];
                          const lastRecord =
                            chartData.babyRecords[
                              chartData.babyRecords.length - 1
                            ];
                          const weightGain =
                            lastRecord.weight_kg - firstRecord.weight_kg;
                          const heightGain =
                            lastRecord.height_cm - firstRecord.height_cm;
                          const daysDiff = dayjs(
                            lastRecord.measurement_date
                          ).diff(dayjs(firstRecord.measurement_date), "days");

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Período:</strong> {daysDiff} dias
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Ganho de peso:</strong>{" "}
                                {weightGain > 0 ? "+" : ""}
                                {weightGain.toFixed(1)}kg
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Crescimento em altura:</strong>{" "}
                                {heightGain > 0 ? "+" : ""}
                                {heightGain.toFixed(1)}cm
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total de medições:</strong>{" "}
                                {chartData.babyRecords.length}
                              </Typography>
                            </>
                          );
                        })()}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <TrendingUp
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  Sem dados para gráficos
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {selectedBabyForChart
                    ? "Este bebê ainda não possui medições registradas"
                    : "Selecione um bebê para visualizar os gráficos"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                >
                  Adicionar Medição
                </Button>
              </CardContent>
            </Card>
          )}
        </TabPanel>

        {/* Dialog de adição/edição */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingRecord
              ? "Editar Registro de Crescimento"
              : "Adicionar Registro de Crescimento"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Bebê</InputLabel>
                <Select
                  value={formData.baby_id}
                  onChange={(e) =>
                    setFormData({ ...formData, baby_id: e.target.value })
                  }
                  label="Bebê"
                  required
                >
                  {babies.map((baby) => (
                    <MenuItem key={baby.id} value={baby.id}>
                      {baby.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Data da Medição"
                value={formData.measurement_date}
                onChange={(date) =>
                  setFormData({ ...formData, measurement_date: date })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    required: true,
                  },
                }}
                maxDate={dayjs()}
              />

              <TextField
                fullWidth
                label="Peso"
                type="number"
                value={formData.weight_grams}
                onChange={(e) =>
                  setFormData({ ...formData, weight_grams: e.target.value })
                }
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">gramas</InputAdornment>
                  ),
                }}
                placeholder="Ex: 3200"
              />

              <TextField
                fullWidth
                label="Altura"
                type="number"
                value={formData.height_cm}
                onChange={(e) =>
                  setFormData({ ...formData, height_cm: e.target.value })
                }
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">cm</InputAdornment>
                  ),
                }}
                placeholder="Ex: 48.5"
              />

              <TextField
                fullWidth
                label="Perímetro Cefálico"
                type="number"
                value={formData.head_circumference_cm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    head_circumference_cm: e.target.value,
                  })
                }
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">cm</InputAdornment>
                  ),
                }}
                placeholder="Ex: 34.0"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Local da Medição</InputLabel>
                <Select
                  value={formData.measurement_location}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      measurement_location: e.target.value,
                    })
                  }
                  label="Local da Medição"
                >
                  {measurementLocations.map((location) => (
                    <MenuItem key={location.value} value={location.value}>
                      {location.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Observações"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
                placeholder="Ex: consulta de rotina, crescimento normal..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
            >
              {loading ? "Salvando..." : editingRecord ? "Salvar" : "Adicionar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Confirmação */}
        <Dialog
          open={confirmDialogOpen}
          onClose={handleCancelDelete}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Warning color="warning" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja excluir este registro de crescimento? Esta
              ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
              disabled={loading}
            >
              Excluir
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            }}
            icon={
              snackbar.severity === "success" ? (
                <CheckCircle />
              ) : snackbar.severity === "error" ? (
                <ErrorIcon />
              ) : snackbar.severity === "warning" ? (
                <Warning />
              ) : (
                <Info />
              )
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
}
