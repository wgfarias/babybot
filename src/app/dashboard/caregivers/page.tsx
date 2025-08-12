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
} from "@mui/material";
import {
  Add,
  Person,
  Edit,
  Delete,
  Phone,
  Email,
  Group as FamilyIcon,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Caregiver } from "@/lib/supabase";

interface CaregiverFormData {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

const relationshipOptions = [
  { value: "pai", label: "Pai" },
  { value: "mae", label: "Mãe" },
  { value: "avo", label: "Avô" },
  { value: "ava", label: "Avó" },
  { value: "tio", label: "Tio" },
  { value: "tia", label: "Tia" },
  { value: "babá", label: "Babá" },
  { value: "outro", label: "Outro" },
];

export default function CaregiversPage() {
  const { family, caregiver: currentCaregiver } = useAuth();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCaregiver, setEditingCaregiver] = useState<Caregiver | null>(
    null
  );
  const [formData, setFormData] = useState<CaregiverFormData>({
    name: "",
    phone: "",
    email: "",
    relationship: "",
  });

  useEffect(() => {
    loadCaregivers();
  }, [family, currentCaregiver]);

  const loadCaregivers = async () => {
    try {
      setLoading(true);
      setError(""); // Limpar erro anterior

      // Se não temos família ainda, tentar carregar via cuidador atual
      let familyId = family?.id;

      if (!familyId && currentCaregiver?.family_id) {
        familyId = currentCaregiver.family_id;
      }

      if (!familyId) {
        setError("ID da família não encontrado. Tente fazer login novamente.");
        return;
      }

      const { data, error } = await supabase
        .from("caregivers")
        .select("*")
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCaregivers(data || []);
    } catch (error: any) {
      console.error("Erro completo:", error);
      setError(`Erro ao carregar cuidadores: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (caregiver?: Caregiver) => {
    if (caregiver) {
      setEditingCaregiver(caregiver);
      setFormData({
        name: caregiver.name,
        phone: caregiver.phone || "",
        email: caregiver.email || "",
        relationship: caregiver.relationship || "",
      });
    } else {
      setEditingCaregiver(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        relationship: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCaregiver(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      relationship: "",
    });
  };

  const handleSubmit = async () => {
    if (!family || !formData.name || !formData.phone) {
      setError("Por favor, preencha pelo menos nome e telefone");
      return;
    }

    try {
      setLoading(true);

      if (editingCaregiver) {
        // Atualizar cuidador existente
        const { error } = await supabase
          .from("caregivers")
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            relationship: formData.relationship || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingCaregiver.id);

        if (error) throw error;
      } else {
        // Criar novo cuidador
        const { error } = await supabase.from("caregivers").insert({
          family_id: family.id,
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          relationship: formData.relationship || null,
        });

        if (error) throw error;
      }

      handleCloseDialog();
      loadCaregivers();
    } catch (error: any) {
      setError(error.message || "Erro ao salvar cuidador");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (caregiverId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cuidador?")) return;

    // Verificar se é o próprio usuário logado
    if (currentCaregiver && caregiverId === currentCaregiver.id) {
      setError("Você não pode excluir sua própria conta");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("caregivers")
        .delete()
        .eq("id", caregiverId);

      if (error) throw error;
      loadCaregivers();
    } catch (error: any) {
      setError(error.message || "Erro ao excluir cuidador");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, "");

    if (phoneNumber.length >= 11) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
    } else if (phoneNumber.length >= 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7)}`;
    } else if (phoneNumber.length >= 2) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    } else if (phoneNumber.length >= 1) {
      return `(${phoneNumber}`;
    }

    return phoneNumber;
  };

  const getRelationshipLabel = (relationship?: string | null) => {
    const option = relationshipOptions.find(
      (opt) => opt.value === relationship
    );
    return option ? option.label : relationship || "Não informado";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (loading && caregivers.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 4,
        }}
      >
        <Typography>Carregando...</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Família: {family?.id || "não encontrada"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Cuidador: {currentCaregiver?.id || "não encontrado"}
        </Typography>
      </Box>
    );
  }

  return (
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
          Cuidadores
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Adicionar Cuidador
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {caregivers.length === 0 && !loading ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Person sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Nenhum cuidador cadastrado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Adicione os cuidadores da família para controlar o acesso
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Adicionar Primeiro Cuidador
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cuidador</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Relacionamento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {caregivers.map((caregiver) => (
                <TableRow key={caregiver.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {getInitials(caregiver.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {caregiver.name}
                        </Typography>
                        {currentCaregiver?.id === caregiver.id && (
                          <Chip
                            label="Você"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Phone sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2">
                          {caregiver.phone}
                        </Typography>
                      </Box>
                      {caregiver.email && (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Email
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {caregiver.email}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getRelationshipLabel(caregiver.relationship)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label="Ativo"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleOpenDialog(caregiver)}
                      size="small"
                      disabled={loading}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(caregiver.id)}
                      size="small"
                      color="error"
                      disabled={
                        loading || currentCaregiver?.id === caregiver.id
                      }
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCaregiver ? "Editar Cuidador" : "Adicionar Cuidador"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nome Completo"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                setFormData({ ...formData, phone: formatted });
              }}
              margin="normal"
              required
              inputProps={{
                maxLength: 15,
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              margin="normal"
              helperText="Email é opcional"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Relacionamento</InputLabel>
              <Select
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                label="Relacionamento"
              >
                <MenuItem value="">Não informar</MenuItem>
                {relationshipOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading
              ? "Salvando..."
              : editingCaregiver
                ? "Salvar"
                : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
