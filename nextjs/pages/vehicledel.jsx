import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Grid, Typography, Button, Stack } from "@mui/material";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

export default function VehicleDelete() {
  const router = useRouter();
  const { id, ids } = router.query;

  const idList = useMemo(() => {
    if (ids) return String(ids).split(",").map((s) => s.trim()).filter(Boolean);
    if (id) return [String(id)];
    return [];
  }, [id, ids]);

  const [deleting, setDeleting] = useState(false);

  const performDelete = async () => {
    if (!idList.length) {
      Swal.fire({ icon: "info", title: "No selection", text: "No vehicle id provided." });
      return;
    }

    const confirm = await Swal.fire({
      icon: "warning",
      title: `Delete ${idList.length} vehicle${idList.length > 1 ? "s" : ""}?`,
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d32f2f",
    });

    if (!confirm.isConfirmed) return;

    try {
      setDeleting(true);
      for (const vid of idList) {
        const res = await fetch(`http://localhost:8000/vehicles/${encodeURIComponent(vid)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Delete failed for id ${vid}`);
        }
      }
      await Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
      router.push("/mainpage");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    // auto-open confirm when query is ready
    if (router.isReady && idList.length) {
      // you can auto-call performDelete() if you prefer
    }
  }, [router.isReady, idList]);

  return (
    <Box sx={{
      minHeight: "100vh", bgcolor: "#2f2f2f",
      display: "flex", alignItems: "center", justifyContent: "center",
      p: { xs: 2, md: 4 },
    }}>
      <Paper elevation={6} sx={{
        width: "100%", maxWidth: 700, borderRadius: 3, overflow: "hidden",
        p: { xs: 3, md: 4 },
      }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography sx={{ fontSize: 28, fontWeight: 800, letterSpacing: 1, mb: 1 }}>
              Delete Vehicle
            </Typography>
            <Box sx={{ width: 48, height: 6, bgcolor: "#ff9702", mb: 3 }} />
            {idList.length ? (
              <>
                <Typography sx={{ mb: 2 }}>
                  You are about to delete the following ID{ idList.length > 1 ? "s" : "" }:
                </Typography>
                <Box sx={{
                  bgcolor: "#f6f6f6", borderRadius: 2, p: 2, mb: 3, fontFamily: "monospace",
                }}>
                  {idList.join(", ")}
                </Box>
              </>
            ) : (
              <Typography sx={{ mb: 3 }}>No vehicle id provided in the URL.</Typography>
            )}

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => router.push("/mainpage")}
                sx={{ color: "#000", borderColor: "#000" }}>
                Cancel
              </Button>
              <Button variant="contained" disabled={!idList.length || deleting}
                onClick={performDelete}
                sx={{ bgcolor: "#d32f2f", "&:hover": { bgcolor: "#b71c1c" } }}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
