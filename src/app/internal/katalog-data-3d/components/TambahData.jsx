"use client";

import { Box, Button, IconButton, MenuItem, TextField, Typography } from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Close } from "@mui/icons-material";

// Style dasar dipakai untuk semua TextField agar konsisten dengan TambahData
const textFieldStyle = {
    "& .MuiInputBase-input": { color: "#1F2937" },
    "& .MuiInputLabel-root": { color: "#6B7280" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#1976D2" },
    "& .MuiOutlinedInput-root": {
        "& fieldset": { borderColor: "#BFC5CC" },
        "&:hover fieldset": { borderColor: "#1976D2" },
        "&.Mui-focused fieldset": { borderColor: "#1976D2" },
    },
};

// Style khusus untuk field disabled (Nama Layer, URL File) agar tetap terbaca jelas
const disabledFieldStyle = {
    ...textFieldStyle,
    "& .MuiInputBase-input.Mui-disabled": {
        color: "#1F2937",
        WebkitTextFillColor: "#1F2937", // penting: override default fade Safari/Chrome
    },
    "& .MuiInputLabel-root.Mui-disabled": { color: "#6B7280" },
    "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
        borderColor: "#D1D5DB",
    },
};

const TambahData = ({ form, setForm, handleCloseAdd, getData, accessToken }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [centerPoint, setCenterPoint] = useState([-6.2088, 106.8456]);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        let isMounted = true;
        if (!isMounted || !mapRef.current) return;

        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        const map = L.map(mapRef.current).setView(centerPoint, 13);
        mapInstanceRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        markerRef.current = L.marker(centerPoint).addTo(map);

        // Menyesuaikan ukuran peta saat berada di dalam Modal MUI
        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        map.on("click", (e) => {
            const { lat, lng } = e.latlng;
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }

            setCenterPoint([lat, lng]);

            if (setForm) {
                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));
            }
        });

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const handleSubmitData = async () => {
        try {
            if (!form?.file) {
                alert("Silakan pilih file 3D terlebih dahulu!");
                return;
            }

            const formData = new FormData();
            formData.append("file", form.file);
            formData.append("nama", form.nama || "");
            formData.append("akses", form.akses || "public");
            formData.append("latitude", form.latitude || centerPoint[0]);
            formData.append("longitude", form.longitude || centerPoint[1]);
            formData.append("heading", form.heading);
            formData.append("pitch", form.pitch);
            formData.append("roll", form.roll);
            formData.append("scale", form.scale)

            const response = await fetch("/portal/api/katalog-data-3d/create", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal menyimpan data");
            }

            alert("Berhasil menambah data 3D!");
            handleCloseAdd(); // tutup modal
            getData(); // refresh table katalog
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <Box
            sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: { xs: "90%", sm: 600, md: 700 },
                bgcolor: "#fff",
                color: "#1E1E2D",
                borderRadius: 3,
                boxShadow: 24,
                p: 3,
                outline: "none",
            }}
        >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography id="modal-tambah-data-3d" variant="h6" sx={{ fontWeight: 700, color: "#1E1E2D" }}>
                    Tambah Layer Data 3D
                </Typography>
                <IconButton onClick={handleCloseAdd} size="small" sx={{ color: "#6B7280" }}>
                    <Close />
                </IconButton>
            </Box><Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mt: 1 }}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                        mt: 1,
                        flex: 1,
                    }}
                >
                    {/* Nama Layer */}
                    <TextField
                        label="Nama Layer"
                        fullWidth
                        value={form?.nama || ""}
                        onChange={(e) =>
                            setForm &&
                            setForm((f) => ({
                                ...f,
                                nama: e.target.value,
                            }))
                        }
                        sx={{
                            "& .MuiInputBase-input": { color: "#1F2937" },
                            "& .MuiInputLabel-root": { color: "#6B7280" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#1976D2" },
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "#BFC5CC" },
                                "&:hover fieldset": { borderColor: "#1976D2" },
                                "&.Mui-focused fieldset": { borderColor: "#1976D2" },
                            },
                        }}
                    />

                    {/* Upload File */}
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        sx={{
                            textTransform: "none",
                            justifyContent: "flex-start",
                            py: 1.2,
                            borderRadius: 2,
                            color: "#4B5563",
                            borderColor: "#AFC8B8",
                            "&:hover": {
                                borderColor: "#388E3C",
                                backgroundColor: "#F5FAF6",
                            },
                        }}
                    >
                        <Typography
                            noWrap
                            sx={{ fontSize: 14, maxWidth: "220px", textOverflow: "ellipsis" }}
                        >
                            {form?.file ? form.file.name : "Pilih File 3D (.glb, .ply)"}
                        </Typography>

                        <input
                            type="file"
                            accept=".glb,.ply"
                            hidden
                            onChange={(e) =>
                                setForm &&
                                setForm((f) => ({
                                    ...f,
                                    file: e.target.files?.[0] || null,
                                }))
                            }
                        />
                    </Button>

                    {/* Hak Akses */}
                    <TextField
                        select
                        label="Akses"
                        fullWidth
                        value={form?.akses || "public"}
                        onChange={(e) =>
                            setForm &&
                            setForm((f) => ({
                                ...f,
                                akses: e.target.value,
                            }))
                        }
                        sx={{
                            "& .MuiInputBase-input": { color: "#1F2937" },
                            "& .MuiSelect-select": { color: "#1F2937" },
                            "& .MuiInputLabel-root": { color: "#6B7280" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#1976D2" },
                            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#BFC5CC" },
                            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1976D2" },
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#1976D2",
                            },
                            "& .MuiSelect-icon": { color: "#6B7280" },
                        }}
                    >
                        <MenuItem value="public">Public</MenuItem>
                        <MenuItem value="private">Private</MenuItem>
                    </TextField>

                    {/* Orientasi: Heading, Pitch, Roll */}
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                        <TextField
                            label="Heading"
                            type="number"
                            fullWidth
                            value={form?.heading ?? 0}
                            onChange={(e) =>
                                setForm &&
                                setForm((f) => ({
                                    ...f,
                                    heading: e.target.value,
                                }))
                            }
                            inputprops={{ step: "1" }}
                            sx={textFieldStyle}
                        />
                        <TextField
                            label="Pitch"
                            type="number"
                            fullWidth
                            value={form?.pitch ?? 0}
                            onChange={(e) =>
                                setForm &&
                                setForm((f) => ({
                                    ...f,
                                    pitch: e.target.value,
                                }))
                            }
                            inputprops={{ step: "1" }}
                            sx={textFieldStyle}
                        />
                        <TextField
                            label="Roll"
                            type="number"
                            fullWidth
                            value={form?.roll ?? 0}
                            onChange={(e) =>
                                setForm &&
                                setForm((f) => ({
                                    ...f,
                                    roll: e.target.value,
                                }))
                            }
                            inputprops={{ step: "1" }}
                            sx={textFieldStyle}
                        />
                    </Box>

                    {/* Scale */}
                    <TextField
                        label="Scale"
                        type="number"
                        fullWidth
                        value={form?.scale ?? 1}
                        onChange={(e) =>
                            setForm &&
                            setForm((f) => ({
                                ...f,
                                scale: e.target.value,
                            }))
                        }
                        inputprops={{ step: "0.1", min: "0" }}
                        sx={{
                            "& .MuiInputBase-input": { color: "#1F2937" },
                            "& .MuiInputLabel-root": { color: "#6B7280" },
                            "& .MuiInputLabel-root.Mui-focused": { color: "#1976D2" },
                            "& .MuiOutlinedInput-root": {
                                "& fieldset": { borderColor: "#BFC5CC" },
                                "&:hover fieldset": { borderColor: "#1976D2" },
                                "&.Mui-focused fieldset": { borderColor: "#1976D2" },
                            },
                        }}
                    />

                    {/* Tombol Aksi */}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-end",
                            gap: "10px",
                        }}
                    >
                        <Button
                            variant="contained"
                            color="warning"
                            onClick={handleCloseAdd}
                            sx={{ textTransform: "none" }}
                        >
                            Batalkan
                        </Button>

                        <Button
                            variant="contained"
                            color="info"
                            onClick={handleSubmitData}
                            sx={{ textTransform: "none" }}
                        >
                            Simpan
                        </Button>
                    </Box>
                </Box>

                {/* Peta Pemilihan Lokasi */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        alignItems: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: { xs: "100%", md: "300px" },
                            height: "250px",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid #E5E7EB",
                        }}
                        ref={mapRef}
                    />

                    <Typography variant="caption" sx={{ color: "#6B7280" }}>
                        <b>Lat:</b> {centerPoint[0].toFixed(6)}, <b>Lng:</b> {centerPoint[1].toFixed(6)}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default TambahData;