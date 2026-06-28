import { Box, Toolbar } from "@mui/material";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";

const drawerWidth = 280;

export default function AdminLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#F4F7FC"
      }}
    >
      <AdminSidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          bgcolor: "#F5F7FB",
          minHeight: "100vh",
          overflowX: "hidden",
          width: "100%"
        }}
      >
        <Toolbar />

        <Outlet />
      </Box>
    </Box>
  );
}