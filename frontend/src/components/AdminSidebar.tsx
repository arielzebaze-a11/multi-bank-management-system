import useAuth from "../hooks/useAuth";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip
} from "@mui/material";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";

import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 260;

export default function AdminSidebar() {

    const navigate = useNavigate();
    const location = useLocation();
    const { nom, role, banque, initiales } = useAuth();

    const menus = [

        {
            title:"Dashboard",
            icon:<DashboardRoundedIcon/>,
            path:"/admin/dashboard"
        },

        {
            title:"Utilisateurs",
            icon:<PeopleAltRoundedIcon/>,
            path:"/admin/users"
        },

        {
            title:"Transactions",
            icon:<ReceiptLongRoundedIcon/>,
            path:"/admin/transactions"
        },

        {
            title:"Rapports",
            icon:<DescriptionRoundedIcon/>,
            path:"/admin/reports"
        }

    ];

    return (

        <Drawer
            variant="permanent"
            sx={{

                width:drawerWidth,

                flexShrink:0,

                "& .MuiDrawer-paper":{

                    width:drawerWidth,

                    background:"#0D47A1",

                    borderRight:"none",

                    color:"white",

                    boxSizing:"border-box"

                }

            }}
        >

            <Box
                sx={{
                    p:3
                }}
            >

                <Box
                    sx={{
                        display:"flex",
                        alignItems:"center",
                        gap:2
                    }}
                >

                    <Avatar
                        sx={{
                            bgcolor:"#1565C0",
                            width:55,
                            height:55
                        }}
                    >

                        <AccountBalanceRoundedIcon/>

                    </Avatar>

                    <Box>

                        <Typography
                            sx={{
                                color: "#BBDEFB",
                                fontSize: 13
                            }}
                        >
                            Banking System
                        </Typography>

                    </Box>

                </Box>

                <Chip
                    label="ONLINE"
                    color="success"
                    size="small"
                    sx={{
                        mt:2
                    }}
                />

            </Box>

            <Divider
                sx={{
                    bgcolor:"rgba(255,255,255,.15)"
                }}
            />

            <List
                sx={{
                    mt:2,
                    px:2
                }}
            >

                {

                    menus.map((menu)=>(

                        <ListItemButton

                            key={menu.title}

                            onClick={()=>navigate(menu.path)}

                            selected={location.pathname===menu.path}

                            sx={{

                                borderRadius:3,

                                mb:1,

                                py:1.4,

                                transition:"all .25s",

                                "&:hover":{

                                    bgcolor:"#1565C0"

                                },

                                "&.Mui-selected":{

                                    bgcolor:"white",

                                    color:"#1565C0",

                                    fontWeight:700

                                }

                            }}

                        >

                            <ListItemIcon
                                sx={{
                                    color:"inherit",
                                    minWidth:40
                                }}
                            >

                                {menu.icon}

                            </ListItemIcon>

                            <ListItemText
                                primary={menu.title}
                            />

                        </ListItemButton>

                    ))

                }

            </List>

            <Box sx={{flexGrow:1}}/>

            <Divider
                sx={{
                    bgcolor:"rgba(255,255,255,.15)"
                }}
            />

            <Box
                sx={{
                    p:3
                }}
            >

                <Box
                    sx={{
                        display:"flex",
                        alignItems:"center",
                        gap:2
                    }}
                >

                    <Avatar
                        sx={{
                            bgcolor:"#1565C0"
                        }}
                    >
                        {initiales}
                    </Avatar>

                    <Box>

                       <Box>

                          <Typography
                              sx={{
                                  fontWeight: 700
                              }}
                          >
                              {nom}
                          </Typography>

                          <Typography
                              sx={{
                                  color: "#BBDEFB",
                                  fontSize: 13
                              }}
                          >
                              {role}
                          </Typography>

                          <Typography
                              sx={{
                                  color: "#90CAF9",
                                  fontSize: 12
                              }}
                          >
                              {banque}
                          </Typography>

                      </Box>

                    </Box>

                </Box>

                <ListItemButton
                    onClick={() => {
                        localStorage.clear();
                        navigate("/");
                    }}
                    sx={{
                        mt:2,
                        borderRadius:2
                    }}
                >

                    <ListItemIcon
                        sx={{
                            color:"white"
                        }}
                    >

                        <LogoutRoundedIcon/>

                    </ListItemIcon>

                    <ListItemText
                        primary="Déconnexion"
                    />

                </ListItemButton>

            </Box>

        </Drawer>

    );

}