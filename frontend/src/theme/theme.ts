import { createTheme } from "@mui/material/styles";

const theme = createTheme({

  palette: {

    primary: {
      main: "#1565C0"
    },

    secondary: {
      main: "#1E88E5"
    },

    success: {
      main: "#2E7D32"
    },

    error: {
      main: "#C62828"
    },

    warning: {
      main: "#F9A825"
    },

    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF"
    }

  },

  shape: {

    borderRadius: 14

  },

  typography: {

    fontFamily: "Inter, Roboto, Arial",

    h4: {

      fontWeight: 700

    },

    h5: {

      fontWeight: 700

    },

    button: {

      textTransform: "none",
      fontWeight: 600

    }

  }

});

export default theme;