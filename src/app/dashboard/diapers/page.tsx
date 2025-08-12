"use client";

import React, { useState, useCallback } from "react";
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
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Rating,
} from "@mui/material";
import {
  Add,
  ChildFriendly,
  Edit,
  Delete,
  CloudQueue,
  Grain,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  Refresh,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Baby } from "@/lib/supabase";
import { usePageData } from "@/hooks/usePageData";
import LoadingSpinner from "@/components/LoadingSpinner";
import EvolutionChart, { PeriodFilter } from "@/components/EvolutionChart";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

interface DiaperRecord {
  id: string;
  baby_id: string;
  caregiver_id: string;
  diaper_type: string;
  consistency: string | null;
  color: string | null;
  smell_intensity: number | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

interface DiaperRecordWithRelations extends DiaperRecord {
  baby_name: string;
  caregiver_name: string;
}

interface DiaperFormData {
  baby_id: string;
  diaper_type: string;
  recorded_at: dayjs.Dayjs | null;
  consistency: string;
  color: string;
  smell_intensity: number;
  notes: string;
}

const diaperTypeOptions = [
  { value: "pum", label: "💨 Pum", emoji: "💨" },
  { value: "coco", label: "💩 Cocô", emoji: "💩" },
  { value: "xixi", label: "💧 Xixi", emoji: "💧" },
  { value: "misto", label: "🌈 Misto", emoji: "🌈" },
];

const consistencyOptions = [
  { value: "liquido", label: "Líquido" },
  { value: "pastoso", label: "Pastoso" },
  { value: "solido", label: "Sólido" },
  { value: "seco", label: "Seco" },
];

const colorOptions = [
  { value: "amarelo", label: "Amarelo" },
  { value: "marrom", label: "Marrom" },
  { value: "verde", label: "Verde" },
  { value: "branco", label: "Branco" },
  { value: "outro", label: "Outro" },
];

export default function DiapersPage() {
  const { family, caregiver } = useAuth();
  const [diaperRecords, setDiaperRecords] = useState<
    DiaperRecordWithRelations[]
  >([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  
  // Estados para o gráfico
  const [selectedBabyChart, setSelectedBabyChart] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("week");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<DiaperRecordWithRelations | null>(null);
  const [formData, setFormData] = useState<DiaperFormData>({
    baby_id: "",
    diaper_type: "",
    recorded_at: dayjs(),
    consistency: "",
    color: "",
    smell_intensity: 3,
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

  const loadData = useCallback(async () => {
    if (!family) return;

    // Carregar bebês
    const { data: babiesData, error: babiesError } = await supabase
      .from("babies")
      .select("*")
      .eq("family_id", family.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (babiesError) throw babiesError;
    setBabies(babiesData || []);

    // Carregar registros de fraldas
    const { data, error } = await supabase
      .from("diaper_records")
      .select(
        `
        *,
        babies!diaper_records_baby_id_fkey(name),
        caregivers!diaper_records_caregiver_id_fkey(name)
      `
      )
      .eq("babies.family_id", family.id)
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    const recordsWithRelations = (data || []).map((record: any) => ({
      ...record,
      baby_name: record.babies?.name || "Bebê não encontrado",
      caregiver_name: record.caregivers?.name || "Cuidador não encontrado",
    }));

    setDiaperRecords(recordsWithRelations);
  }, [family]);

  const { loading, error, retry, isRetrying } = usePageData({
    loadData,
  });

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

  const handleQuickRecord = async (babyId: string, type: string) => {
    if (!caregiver) return;

    // Para registros de cocô, não permitir registro rápido - exigir formulário completo
    if (type === "coco") {
      showSnackbar(
        "Para registros de cocô, use o formulário completo para informar a consistência",
        "warning"
      );
      handleOpenDialog(); // Abrir o formulário completo
      return;
    }

    try {
      const { error } = await supabase.from("diaper_records").insert({
        baby_id: babyId,
        caregiver_id: caregiver.id,
        diaper_type: type,
        recorded_at: new Date().toISOString(),
        smell_intensity: type === "pum" ? 2 : type === "xixi" ? 1 : 2,
        // consistency não é necessário para pum, xixi, misto
      });

      if (error) throw error;

      const typeEmoji =
        diaperTypeOptions.find((opt) => opt.value === type)?.emoji || "🍼";
      showSnackbar(`${typeEmoji} Registro adicionado com sucesso!`, "success");
      retry();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao adicionar registro", "error");
    }
  };

  const handleOpenDialog = (record?: DiaperRecordWithRelations) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        baby_id: record.baby_id,
        diaper_type: record.diaper_type,
        recorded_at: dayjs(record.recorded_at),
        consistency: record.consistency || "",
        color: record.color || "",
        smell_intensity: record.smell_intensity || 3,
        notes: record.notes || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        baby_id: babies[0]?.id || "",
        diaper_type: "",
        recorded_at: dayjs(),
        consistency: "",
        color: "",
        smell_intensity: 3,
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async () => {
    if (
      !caregiver ||
      !formData.baby_id ||
      !formData.diaper_type ||
      !formData.recorded_at
    ) {
      showSnackbar("Por favor, preencha os campos obrigatórios", "warning");
      return;
    }

    // Validação específica para cocôs - consistência é obrigatória
    if (formData.diaper_type === "coco" && !formData.consistency) {
      showSnackbar(
        "Para registros de cocô, a consistência é obrigatória",
        "warning"
      );
      return;
    }

    try {
      const diaperData = {
        baby_id: formData.baby_id,
        caregiver_id: caregiver.id,
        diaper_type: formData.diaper_type,
        recorded_at: formData.recorded_at.toISOString(),
        consistency:
          formData.diaper_type === "coco" ? formData.consistency : null,
        color: formData.diaper_type === "coco" ? formData.color || null : null,
        smell_intensity: formData.smell_intensity || null,
        notes: formData.notes || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from("diaper_records")
          .update(diaperData)
          .eq("id", editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diaper_records")
          .insert(diaperData);

        if (error) throw error;
      }

      handleCloseDialog();
      showSnackbar(
        editingRecord
          ? "Registro atualizado com sucesso!"
          : "Registro criado com sucesso!",
        "success"
      );
      retry();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao salvar registro", "error");
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      const { error, data } = await supabase
        .from("diaper_records")
        .delete()
        .eq("id", recordId)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        showSnackbar("Nenhum registro foi encontrado para exclusão", "warning");
        return;
      }

      showSnackbar("Registro excluído com sucesso!", "success");
      retry();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao excluir registro", "error");
    }
  };

  const getTypeIcon = (type: string) => {
    const option = diaperTypeOptions.find((opt) => opt.value === type);
    return option?.emoji || "🍼";
  };

  // Função para processar dados do gráfico de fraldas
  const processDiaperChartData = (data: DiaperRecordWithRelations[], period: PeriodFilter) => {
    const filteredData = selectedBabyChart === "all" ? data : data.filter(record => record.baby_id === selectedBabyChart);
    
    const now = dayjs();
    let startDate: dayjs.Dayjs;
    let groupFormat: string;
    let labelFormat: string;
    
    switch (period) {
      case "day":
        startDate = now.subtract(6, "day");
        groupFormat = "YYYY-MM-DD";
        labelFormat = "DD/MM";
        break;
      case "week":
        startDate = now.subtract(3, "week").startOf("week");
        groupFormat = "YYYY-MM-DD";
        labelFormat = "DD/MM";
        break;
      case "month":
        startDate = now.subtract(5, "month");
        groupFormat = "YYYY-MM";
        labelFormat = "MMM/YY";
        break;
      default:
        startDate = now.subtract(3, "week").startOf("week");
        groupFormat = "YYYY-MM-DD";
        labelFormat = "DD/MM";
    }

    const periodData = filteredData.filter(record => {
      const recordDate = dayjs(record.recorded_at);
      return recordDate.isAfter(startDate);
    });

    const groupedData: { [key: string]: { [type: string]: number } } = {};
    
    periodData.forEach(record => {
      const recordDate = dayjs(record.recorded_at);
      const key = recordDate.format(groupFormat);
      const type = record.diaper_type;
      
      if (!groupedData[key]) groupedData[key] = {};
      if (!groupedData[key][type]) groupedData[key][type] = 0;
      groupedData[key][type]++;
    });

    const labels: string[] = [];
    const totalDiapers: number[] = [];
    const cocosCount: number[] = [];
    const pumsCount: number[] = [];
    const xixisCount: number[] = [];

    let currentDate = startDate;
    const increment = period === "day" ? 1 : period === "week" ? 7 : 30;
    const unit = period === "day" ? "day" : period === "week" ? "day" : "month";
    
    while (currentDate.isBefore(now) || currentDate.isSame(now, 'day')) {
      const key = currentDate.format(groupFormat);
      const label = currentDate.format(labelFormat);
      
      labels.push(label);
      
      if (groupedData[key]) {
        const total = Object.values(groupedData[key]).reduce((a, b) => a + b, 0);
        totalDiapers.push(total);
        cocosCount.push(groupedData[key]['coco'] || 0);
        pumsCount.push(groupedData[key]['pum'] || 0);
        xixisCount.push(groupedData[key]['xixi'] || 0);
      } else {
        totalDiapers.push(0);
        cocosCount.push(0);
        pumsCount.push(0);
        xixisCount.push(0);
      }
      
      currentDate = currentDate.add(increment, unit as any);
    }

    return {
      labels,
      datasets: [
        {
          label: "Total de Fraldas",
          data: totalDiapers,
          borderColor: "rgb(99, 102, 241)",
          backgroundColor: "rgba(99, 102, 241, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "💩 Cocôs",
          data: cocosCount,
          borderColor: "rgb(139, 69, 19)",
          backgroundColor: "rgba(139, 69, 19, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: "💨 Puns",
          data: pumsCount,
          borderColor: "rgb(255, 152, 0)",
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: "💧 Xixis",
          data: xixisCount,
          borderColor: "rgb(33, 150, 243)",
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
      ],
    };
  };

  const getTodayStats = () => {
    const today = dayjs().format("YYYY-MM-DD");
    const todayRecords = diaperRecords.filter(
      (record) => dayjs(record.recorded_at).format("YYYY-MM-DD") === today
    );

    return {
      total: todayRecords.length,
      pum: todayRecords.filter((r) => r.diaper_type === "pum").length,
      coco: todayRecords.filter((r) => r.diaper_type === "coco").length,
      xixi: todayRecords.filter((r) => r.diaper_type === "xixi").length,
      misto: todayRecords.filter((r) => r.diaper_type === "misto").length,
    };
  };

  if (loading && diaperRecords.length === 0) {
    return <LoadingSpinner message="Carregando registros de fraldas..." />;
  }

  const todayStats = getTodayStats();

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
            Fraldas
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {error && (
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={retry}
                disabled={loading || isRetrying}
              >
                {isRetrying ? "Tentando..." : "Tentar Novamente"}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              disabled={loading}
            >
              Adicionar Registro
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {/* Estatísticas do dia */}
        {todayStats.total > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📊 Resumo de Hoje
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={2.4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4" color="primary">
                      {todayStats.total}
                    </Typography>
                    <Typography variant="body2">Total</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4">💨 {todayStats.pum}</Typography>
                    <Typography variant="body2">Puns</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4">💩 {todayStats.coco}</Typography>
                    <Typography variant="body2">Cocôs</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4">💧 {todayStats.xixi}</Typography>
                    <Typography variant="body2">Xixis</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={2.4}>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="h4">🌈 {todayStats.misto}</Typography>
                    <Typography variant="body2">Mistos</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Evolução das Fraldas */}
        <EvolutionChart
          title="Evolução das Fraldas"
          data={diaperRecords}
          babies={babies}
          selectedBaby={selectedBabyChart}
          onBabyChange={setSelectedBabyChart}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          chartType="line"
          dataProcessor={processDiaperChartData}
          yAxisLabel="Número de Fraldas"
          loading={loading}
        />

        {/* Botões de registro rápido */}
        {babies.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                🚀 Registro Rápido
              </Typography>

              {babies.map((baby) => (
                <Box key={baby.id} sx={{ mb: 2, "&:last-child": { mb: 0 } }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mb: 1.5 }}
                  >
                    {baby.name}
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid item xs={6} sm={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        sx={{
                          bgcolor: "#ff9800",
                        }}
                        onClick={() => handleQuickRecord(baby.id, "pum")}
                        disabled={loading}
                      >
                        💨 Pum
                      </Button>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        sx={{
                          bgcolor: "#8bc34a",
                        }}
                        onClick={() => handleQuickRecord(baby.id, "coco")}
                        disabled={loading}
                      >
                        💩 Cocô
                      </Button>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        size="small"
                        onClick={() => handleQuickRecord(baby.id, "xixi")}
                        disabled={loading}
                      >
                        💧 Xixi
                      </Button>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        size="small"
                        onClick={() => handleQuickRecord(baby.id, "misto")}
                        disabled={loading}
                      >
                        🌈 Misto
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Histórico de registros */}
        <Typography variant="h6" sx={{ mb: 3 }}>
          Histórico de Fraldas
        </Typography>

        {diaperRecords.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <ChildFriendly
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Nenhum registro de fralda
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comece registrando as atividades dos seus bebês
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
              >
                Primeiro Registro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bebê</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Horário</TableCell>
                  <TableCell>Detalhes</TableCell>
                  <TableCell>Cuidador</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diaperRecords.map((record) => (
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
                          <ChildFriendly sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="subtitle2">
                          {record.baby_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${getTypeIcon(record.diaper_type)} ${diaperTypeOptions.find((opt) => opt.value === record.diaper_type)?.label.replace(/.*\s/, "") || record.diaper_type}`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(record.recorded_at).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(record.recorded_at).fromNow()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {record.consistency && (
                          <Typography variant="caption" display="block">
                            Consistência: {record.consistency}
                          </Typography>
                        )}
                        {record.color && (
                          <Typography variant="caption" display="block">
                            Cor: {record.color}
                          </Typography>
                        )}
                        {record.smell_intensity && (
                          <Typography variant="caption" display="block">
                            Cheiro: {record.smell_intensity}/5
                          </Typography>
                        )}
                      </Box>
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

        {/* Dialog de adição/edição */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingRecord
              ? "Editar Registro de Fralda"
              : "Adicionar Registro de Fralda"}
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

              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.diaper_type}
                  onChange={(e) =>
                    setFormData({ ...formData, diaper_type: e.target.value })
                  }
                  label="Tipo"
                  required
                >
                  {diaperTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DateTimePicker
                label="Horário do Evento"
                value={formData.recorded_at}
                onChange={(date) =>
                  setFormData({ ...formData, recorded_at: date })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    required: true,
                  },
                }}
                maxDateTime={dayjs()}
              />

              {formData.diaper_type === "coco" && (
                <>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Consistência</InputLabel>
                    <Select
                      value={formData.consistency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consistency: e.target.value,
                        })
                      }
                      label="Consistência"
                    >
                      <MenuItem value="">Não informar</MenuItem>
                      {consistencyOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Cor</InputLabel>
                    <Select
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      label="Cor"
                    >
                      <MenuItem value="">Não informar</MenuItem>
                      {colorOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography component="legend">
                  Intensidade do Cheiro
                </Typography>
                <Rating
                  value={formData.smell_intensity}
                  onChange={(_, value) =>
                    setFormData({ ...formData, smell_intensity: value || 1 })
                  }
                  max={5}
                  size="large"
                />
              </Box>

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
                placeholder="Ex: fralda muito suja, bebê estava agitado..."
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
              Tem certeza que deseja excluir este registro de fralda? Esta ação
              não pode ser desfeita.
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
