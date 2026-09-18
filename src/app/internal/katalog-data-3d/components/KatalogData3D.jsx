"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Link,
  Modal,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import TambahData from "./TambahData";
import { Visibility } from "@mui/icons-material";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import HapusData from "./HapusData";
import UpdateData from "./UpdateData";

// Keduanya butuh WebGL/browser API — wajib ssr: false
const PreviewCesiumModal = dynamic(() => import("./PreviewCesiumModal"), { ssr: false });
const PreviewPlyModal = dynamic(() => import("./PreviewPlyModal"), { ssr: false });

const DEFAULT_FORM = {
  nama: "",
  file: null,
  akses: "public",
  latitude: "",
  longitude: "",
  heading: 0,
  pitch: 0,
  roll: 0,
  scale: 1,
};

export default function KatalogData3D() {
  const [tableData, setTableData] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [focusItem, setFocusItem] = useState(null);

  const [openPreview, setOpenPreview] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const session = useSession();

  const getData = async () => {
    try {
      const res = await fetch("/portal/api/katalog-data-3d/list", {
        headers: { Authorization: `Bearer ${session?.data?.accessToken}` },
      });
      if (res.ok) {
        const result = await res.json();
        setTableData(result.data || result);
      }
    } catch (err) {
      console.error("Gagal mengambil data tabel:", err);
    }
  };

  useEffect(() => {
    if (session?.data?.accessToken) {
      getData();
    }
  }, [session?.data?.accessToken]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(tableData);
      return;
    }
    const query = search.toLowerCase();
    const result = (tableData || []).filter((item) =>
      item.nama?.toLowerCase().includes(query)
    );
    setFilteredData(result);
  }, [search, tableData]);

  const handleOpenAdd = () => {
    setForm(DEFAULT_FORM);
    setOpenAdd(true);
  };

  const handleCloseAdd = () => {
    setForm(DEFAULT_FORM);
    setOpenAdd(false);
  };

  const handleOpenPreview = (item) => {
    setOpenPreview(true);
    setFocusItem(item);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
    setFocusItem(null);
  };

  const handleOpenDelete = (item) => {
    setOpenDelete(true);
    setFocusItem(item);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setFocusItem(null);
  };

  const handleOpenEdit = (item) => {
    setOpenEdit(true);
    setFocusItem(item);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setFocusItem(null);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#1E1E2D" }}>
          Katalog Data 3D
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, height: "40px" }}>
        <TextField
          placeholder="Cari nama layer..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            mb: 2,
            height: "100%",
            width: 320,
            bgcolor: "#1E1E2D",
            borderRadius: 2,
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiInputBase-input": { color: "#fff" },
            "& .MuiInputBase-input::placeholder": { color: "#E5E7EB", opacity: 0.8 },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#E5E7EB" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        {session?.data?.user?.role !== "viewer" ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              height: "100%",
              bgcolor: "#4F46E5",
              "&:hover": { bgcolor: "#4338CA" },
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Tambah Layer 3D
          </Button>
        ) : null}
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(16,24,40,0.1)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ "& .MuiTableCell-root": { bgcolor: "#1E1E2D", color: "#fff", fontWeight: 600, fontSize: 13, letterSpacing: 0.3 } }}>
              <TableCell>Nama Layer</TableCell>
              <TableCell>URL File</TableCell>
              <TableCell>Koordinat (Lat, Long)</TableCell>
              <TableCell>Pembuat</TableCell>
              <TableCell>Tipe File</TableCell>
              <TableCell>Akses</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData?.length > 0 ? (
              filteredData.map((row) => (
                <TableRow key={row.data_3d_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, color: "#111827" }}>{row.nama}</TableCell>

                  <TableCell>
                    <Link
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{
                        color: "#4F46E5",
                        maxWidth: 220,
                        display: "inline-block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        verticalAlign: "middle",
                      }}
                    >
                      {row.url}
                    </Link>
                  </TableCell>

                  <TableCell sx={{ color: "#4B5563", fontSize: 13 }}>
                    {row.latitude?.toFixed(4)}, {row.longitude?.toFixed(4)}
                  </TableCell>

                  <TableCell sx={{ color: "#374151" }}>{row.users?.email}</TableCell>
                  <TableCell sx={{ color: "#374151" }}>
                    <Chip
                      label={(row.tipe_file).toUpperCase()}
                      size="small"
                      color={row.tipe_file === "glb" ? "success" : "default"}
                      variant={row.tipe_file === "glb" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={(row.akses).toUpperCase()}
                      size="small"
                      color={row.akses === "public" ? "success" : "default"}
                      variant={row.akses === "public" ? "filled" : "outlined"}
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title={row.tipe_file === "ply" ? "Preview Gaussian Splat" : "Preview di Cesium"}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenPreview(row)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {session?.data?.user?.role !== "viewer" ? (
                      <>
                        <Tooltip title="Edit Metadata">
                          <IconButton size="small" color="info" onClick={() => handleOpenEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus Layer">
                          <IconButton size="small" color="error" onClick={() => handleOpenDelete(row)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {search ? "Tidak ada data 3D yang sesuai dengan pencarian." : "Belum ada katalog data 3D."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal Form Tambah Data */}
      <Modal open={openAdd} onClose={handleCloseAdd}>
        <TambahData
          form={form}
          setForm={setForm}
          handleCloseAdd={handleCloseAdd}
          getData={getData}
          accessToken={session?.data?.accessToken}
        />
      </Modal>

      {/* Modal Preview — pilih komponen berdasarkan tipe_file milik data yang dipilih */}
      <Modal open={openPreview} onClose={handleClosePreview}>
        {focusItem?.tipe_file === "ply" ? (
          <PreviewPlyModal
            openPreview={openPreview}
            item={focusItem}
            handleClosePreview={handleClosePreview}
          />
        ) : (
          <PreviewCesiumModal
            openPreview={openPreview}
            item={focusItem}
            handleClosePreview={handleClosePreview}
            accessToken={session?.data?.accessToken}
          />
        )}
      </Modal>

      {/* Modal Hapus Data */}
      <Modal open={openDelete} onClose={handleCloseDelete}>
        <HapusData
          item={focusItem}
          accessToken={session?.data?.accessToken}
          getData={getData}
          handleCloseDelete={handleCloseDelete}
        />
      </Modal>

      {/* Modal Edit Data */}
      <Modal open={openEdit} onClose={handleCloseEdit}>
        <UpdateData
          item={focusItem}
          handleCloseEdit={handleCloseEdit}
          getData={getData}
          accessToken={session?.data?.accessToken}
        />
      </Modal>
    </Box>
  );
}