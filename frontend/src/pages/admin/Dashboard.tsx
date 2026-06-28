import { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider
} from "@mui/material";

import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

import api from "../../services/api";
import StatCard from "../../components/StatCard";

export default function Dashboard() {

  const [stats, setStats] = useState({
    users: 0,
    accounts: 0,
    banks: 0,
    transactions: 0,
    balance: 0
  });
 const auth = useAuth();

console.log("AUTH =", auth);

const nom = auth.nom;

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {

      const response = await api.get("/admin/dashboard");

      setStats(response.data);

    } catch (err) {

      console.error(err);

    }
  }

  return (

    <Box>

      <Typography
        variant="h4"
        sx={{
            fontWeight:700
        }}
      >
        Bonjour {nom} 👋
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Bienvenue dans votre espace d'administration bancaire
      </Typography>

      <Grid container spacing={3}>

        <Grid size={{ xs:12, md:6, lg:3 }}>
          <StatCard
            title="Utilisateurs"
            value={stats.users}
            color="#1976d2"
            icon={<PeopleAltRoundedIcon fontSize="large"/>}
          />
        </Grid>

        <Grid size={{ xs:12, md:6, lg:3 }}>
          <StatCard
            title="Comptes"
            value={stats.accounts}
            color="#2E7D32"
            icon={<AccountBalanceWalletRoundedIcon fontSize="large"/>}
          />
        </Grid>

        <Grid size={{ xs:12, md:6, lg:3 }}>
          <StatCard
            title="Banques"
            value={stats.banks}
            color="#8E24AA"
            icon={<AccountBalanceRoundedIcon fontSize="large"/>}
          />
        </Grid>

        <Grid size={{ xs:12, md:6, lg:3 }}>
          <StatCard
            title="Transactions"
            value={stats.transactions}
            color="#EF6C00"
            icon={<ReceiptLongRoundedIcon fontSize="large"/>}
          />
        </Grid>

      </Grid>

      <Grid
        container
        spacing={3}
        sx={{ mt: 2 }}
      >

        <Grid size={{ xs:12, lg:8 }}>

          <Card
            elevation={0}
            sx={{
              borderRadius:4,
              border:"1px solid #E5E7EB",
              height:320
            }}
          >

            <CardContent>

              <Typography
                  variant="h6"
                  sx={{
                      fontWeight: 700
                  }}
              >
                Evolution des activités
              </Typography>

              <Divider sx={{ my:2 }}/>

              <Box

                sx={{

                  height:220,

                  display:"flex",

                  justifyContent:"center",

                  alignItems:"center",

                  color:"gray"

                }}

              >

                <TrendingUpRoundedIcon
                  sx={{
                    fontSize:60,
                    mr:2
                  }}
                />

                Zone réservée au graphique

              </Box>

            </CardContent>

          </Card>

        </Grid>

        <Grid size={{ xs:12, lg:4 }}>

          <Card

            elevation={0}

            sx={{

              borderRadius:4,

              border:"1px solid #E5E7EB",

              mb:3

            }}

          >

            <CardContent>

              <Typography
                  variant="h6"
                  sx={{
                      fontWeight: 700
                  }}
              >
                Liquidité Totale
              </Typography>

              <Typography

                variant="h4"

                sx={{
                  mt:3,
                  color:"#2E7D32",
                  fontWeight:"bold"
                }}

              >

                {Number(stats.balance).toLocaleString()} FCFA

              </Typography>

            </CardContent>

          </Card>

          <Card

            elevation={0}

            sx={{

              borderRadius:4,

              border:"1px solid #E5E7EB"

            }}

          >

            <CardContent>

              <Typography
                  variant="h6"
                  sx={{
                      fontWeight: 700
                  }}
              >
                Activité récente
              </Typography>

              <Divider sx={{my:2}}/>

              <Typography>
                ✔ Nouveau client enregistré
              </Typography>

              <Typography sx={{mt:2}}>
                ✔ Nouveau compte créé
              </Typography>

              <Typography sx={{mt:2}}>
                ✔ Rapport PDF généré
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>

    </Box>

  );

}