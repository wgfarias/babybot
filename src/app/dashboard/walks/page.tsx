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
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Snackbar,
} from "@mui/material";
import {
  Add,
  DirectionsWalk,
  Edit,
  Delete,
  PlayArrow,
  Stop,
  AccessTime,
  LocationOn,
  Person,
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
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Baby } from "@/lib/supabase";
import { usePageData } from "@/hooks/usePageData";
import LoadingSpinner from "@/components/LoadingSpinner";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale("pt-br");

interface WalkRecord {
  id: string;
  baby_id: string;
  caregiver_id: string;
  walk_start: string;
  walk_end: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WalkRecordWithRelations extends WalkRecord {
  baby_name: string;
  caregiver_name: string;
  duration_minutes?: number;
  is_walking: boolean;
}

interface WalkFormData {
  baby_id: string;
  walk_start: dayjs.Dayjs | null;
  walk_end: dayjs.Dayjs | null;
  location: string;
  notes: string;
}

const walkLocationOptions = [
  { value: "praca", label: "Praça" },
  { value: "parque", label: "Parque" },
  { value: "shopping", label: "Shopping" },
  { value: "rua", label: "Rua/Bairro" },
  { value: "praia", label: "Praia" },
  { value: "casa_familia", label: "Casa de Familiares" },
  { value: "pediatra", label: "Consulta Médica" },
  { value: "outro", label: "Outro" },
];

export default function WalksPage() {
  const { family, caregiver } = useAuth();
  const [walkRecords, setWalkRecords] = useState<WalkRecordWithRelations[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<WalkRecordWithRelations | null>(null);
  const [formData, setFormData] = useState<WalkFormData>({
    baby_id: "",
    walk_start: null,
    walk_end: null,
    location: "",
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

    // Carregar registros de passeios
    const { data, error } = await supabase
      .from("walk_records")
      .select(
        `
        *,
        babies!walk_records_baby_id_fkey(name),
        caregivers!walk_records_caregiver_id_fkey(name)
      `
      )
      .eq("babies.family_id", family.id)
      .order("walk_start", { ascending: false });

    if (error) throw error;

    const recordsWithRelations = (data || []).map((record: any) => {
      let duration_minutes = null;

      if (record.walk_end) {
        const startTime = dayjs(record.walk_start);
        const endTime = dayjs(record.walk_end);
        duration_minutes = Math.max(1, endTime.diff(startTime, "minutes"));
      }

      return {
        ...record,
        baby_name: record.babies?.name || "Bebê não encontrado",
        caregiver_name: record.caregivers?.name || "Cuidador não encontrado",
        is_walking: !record.walk_end,
        duration_minutes,
      };
    });

    setWalkRecords(recordsWithRelations);
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

  const handleStartWalk = async (babyId: string) => {
    if (!caregiver) return;

    try {
      // Verificar se já existe um passeio em andamento nos dados já carregados
      const existingWalk = walkRecords.find(
        (record) => record.baby_id === babyId && record.is_walking
      );

      if (existingWalk) {
        showSnackbar("Este bebê já está passeando!", "warning");
        return;
      }

      const { error } = await supabase.from("walk_records").insert({
        baby_id: babyId,
        caregiver_id: caregiver.id,
        walk_start: new Date().toISOString(),
        location: "rua",
      });

      if (error) throw error;

      showSnackbar("Passeio iniciado com sucesso!", "success");
      retry();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao iniciar passeio", "error");
    }
  };

  const handleEndWalk = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from("walk_records")
        .update({
          walk_end: new Date().toISOString(),
        })
        .eq("id", recordId);

      if (error) throw error;

      showSnackbar("Passeio finalizado com sucesso!", "success");
      retry();
    } catch (error: any) {
      showSnackbar(error.message || "Erro ao finalizar passeio", "error");
    }
  };

  const handleOpenDialog = (record?: WalkRecordWithRelations) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        baby_id: record.baby_id,
        walk_start: dayjs(record.walk_start),
        walk_end: record.walk_end ? dayjs(record.walk_end) : null,
        location: record.location || "",
        notes: record.notes || "",
      });
    } else {
      setEditingRecord(null);
      setFormData({
        baby_id: babies[0]?.id || "",
        walk_start: dayjs(),
        walk_end: null,
        location: "",
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
      walk_start: null,
      walk_end: null,
      location: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    if (!caregiver || !formData.baby_id || !formData.walk_start) {
      showSnackbar("Por favor, preencha os campos obrigatórios", "warning");
      return;
    }

    try {
      const walkData = {
        baby_id: formData.baby_id,
        caregiver_id: caregiver.id,
        walk_start: formData.walk_start.toISOString(),
        walk_end: formData.walk_end ? formData.walk_end.toISOString() : null,
        location: formData.location || null,
        notes: formData.notes || null,
      };

      if (editingRecord) {
        const { error } = await supabase
          .from("walk_records")
          .update(walkData)
          .eq("id", editingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("walk_records").insert(walkData);

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
        .from("walk_records")
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getWalkingBabies = () => {
    return walkRecords.filter((record) => record.is_walking);
  };

  if (loading && walkRecords.length === 0) {
    return <LoadingSpinner message="Carregando registros de passeios..." />;
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
            Passeios
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

        {/* Bebês passeando atualmente */}
        {getWalkingBabies().length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <DirectionsWalk color="primary" />
                Passeando agora
              </Typography>
              <Grid container spacing={2}>
                {getWalkingBabies().map((record) => (
                  <Grid item xs={12} sm={6} md={4} key={record.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {record.baby_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Desde: {dayjs(record.walk_start).format("HH:mm")}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Duração:{" "}
                          {formatDuration(
                            dayjs().diff(dayjs(record.walk_start), "minutes")
                          )}
                        </Typography>
                        {record.location && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            Local:{" "}
                            {walkLocationOptions.find(
                              (opt) => opt.value === record.location
                            )?.label || record.location}
                          </Typography>
                        )}
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<Stop />}
                          onClick={() => handleEndWalk(record.id)}
                          disabled={loading}
                          size="small"
                          fullWidth
                        >
                          Finalizar Passeio
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Bebês em casa - Ações rápidas */}
        {babies.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Iniciar Passeio
              </Typography>
              <Grid container spacing={2}>
                {babies
                  .filter(
                    (baby) =>
                      !getWalkingBabies().some(
                        (record) => record.baby_id === baby.id
                      )
                  )
                  .map((baby) => (
                    <Grid item xs={12} sm={6} md={4} key={baby.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {baby.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                          >
                            Pronto para passear
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartWalk(baby.id)}
                            disabled={loading}
                            size="small"
                            fullWidth
                          >
                            Iniciar Passeio
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Histórico de registros */}
        <Typography variant="h6" sx={{ mb: 3 }}>
          Histórico de Passeios
        </Typography>

        {walkRecords.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <DirectionsWalk
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Nenhum registro de passeio
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comece registrando os passeios dos seus bebês
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
                  <TableCell>Início</TableCell>
                  <TableCell>Fim</TableCell>
                  <TableCell>Duração</TableCell>
                  <TableCell>Local</TableCell>
                  <TableCell>Cuidador</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {walkRecords.map((record) => (
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
                          <DirectionsWalk sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Typography variant="subtitle2">
                          {record.baby_name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dayjs(record.walk_start).format("DD/MM/YYYY HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.walk_end ? (
                        <Typography variant="body2">
                          {dayjs(record.walk_end).format("DD/MM/YYYY HH:mm")}
                        </Typography>
                      ) : (
                        <Chip label="Passeando" color="info" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {record.duration_minutes ? (
                        <Typography variant="body2">
                          {formatDuration(record.duration_minutes)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="primary">
                          {formatDuration(
                            dayjs().diff(dayjs(record.walk_start), "minutes")
                          )}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.location && (
                        <Typography variant="body2">
                          {walkLocationOptions.find(
                            (opt) => opt.value === record.location
                          )?.label || record.location}
                        </Typography>
                      )}
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
              ? "Editar Registro de Passeio"
              : "Adicionar Registro de Passeio"}
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

              <DateTimePicker
                label="Início do Passeio"
                value={formData.walk_start}
                onChange={(date) =>
                  setFormData({ ...formData, walk_start: date })
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

              <DateTimePicker
                label="Fim do Passeio (opcional)"
                value={formData.walk_end}
                onChange={(date) =>
                  setFormData({ ...formData, walk_end: date })
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                    helperText: "Deixe vazio se ainda estiver passeando",
                  },
                }}
                minDateTime={formData.walk_start ?? undefined}
                maxDateTime={dayjs()}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Local do Passeio</InputLabel>
                <Select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  label="Local do Passeio"
                >
                  <MenuItem value="">Não informar</MenuItem>
                  {walkLocationOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
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
                placeholder="Ex: foi até o parque, brincou no playground..."
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
              Tem certeza que deseja excluir este registro de passeio? Esta ação
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
