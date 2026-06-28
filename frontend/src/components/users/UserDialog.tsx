import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Card,
    CardContent,
    Chip,
    Divider,
    Avatar
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";

type Props = {
    open: boolean;
    user: any;
    onClose: () => void;

    blockAccount: (compte: any) => void;
    unblockAccount: (compte: any) => void;
    archiveAccount: (compte: any) => void;
    restoreAccount: (compte: any) => void;
    editLimit: (compte: any) => void;
    viewHistory: (compte: any) => void;
};

export default function UserDialog({
    open,
    user,
    onClose,
    blockAccount,
    unblockAccount,
    archiveAccount,
    restoreAccount,
    editLimit,
    viewHistory
}: Props) {

    if (!user) return null;

    const initiales = user.nom
        ?.split(" ")
        .map((mot: string) => mot.charAt(0))
        .join("")
        .substring(0, 2)
        .toUpperCase();


        
return (

<Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="lg"
>

    <DialogTitle>

        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}
        >
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2
            }}
        >

            <Avatar
                sx={{
                    width: 60,
                    height: 60,
                    bgcolor: "#1565C0",
                    fontWeight: 700
                }}
            >
                {initiales}
            </Avatar>

            <Box>

                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700
                    }}
                >
                    {user.nom}
                </Typography>

                <Typography color="text.secondary">
                    {user.email}
                </Typography>

                <Typography color="text.secondary">
                    {user.telephone}
                </Typography>

            </Box>

        </Box>

        <Button
            color="inherit"
            onClick={onClose}
        >

            <CloseRoundedIcon />

        </Button>

        </Box>

        </DialogTitle>

        <DialogContent dividers>

            <Chip
                label={user.role}
                color={
                    user.role === "ADMIN"
                        ? "error"
                        : "primary"
                }
                sx={{
                    mb: 3,
                    fontWeight: 700
                }}
            />

            <Typography
                variant="h6"
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                    fontWeight: 700
                }}
            >
                <AccountBalanceRoundedIcon />
                Comptes bancaires
            </Typography>

            <Stack spacing={2}>

                {user.comptes?.map((compte: any) => (

                <Card
                    key={compte.accountId}
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: "1px solid #E5E7EB"
                    }}
                >

                    <CardContent>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 2
                            }}
                        >

                            <Box>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700
                                    }}
                                >
                                    🏦 {compte.banque}
                                </Typography>

                                <Typography color="text.secondary">
                                    {compte.numero}
                                </Typography>

                            </Box>

                            <Chip
                                label={compte.statut}
                                color={
                                    compte.statut === "ACTIF"
                                        ? "success"
                                        : compte.statut === "BLOQUE"
                                        ? "warning"
                                        : "default"
                                }
                            />

                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit,minmax(220px,1fr))",
                                gap: 2
                            }}
                        >

                            <Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Numéro
                                </Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 700
                                    }}
                                >
                                    {compte.numero}
                                </Typography>

                            </Box>

                            <Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Agence
                                </Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 700
                                    }}
                                >
                                    {compte.code_agence}
                                </Typography>

                            </Box>

                            <Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Solde
                                </Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        color: "#2E7D32"
                                    }}
                                >
                                    {compte.solde}
                                </Typography>

                            </Box>

                            <Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Limite
                                </Typography>

                                <Typography
                                    sx={{
                                        fontWeight: 700
                                    }}
                                >
                                    {compte.limite_virement}
                                </Typography>

                            </Box>

                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                flexWrap: "wrap",
                                gap: 1
                            }}
                        >

                        {compte.statut === "ACTIF" && (
                        <>
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={<LockRoundedIcon />}
                                onClick={() => blockAccount(compte)}
                            >
                                Bloquer
                            </Button>

                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<Inventory2RoundedIcon />}
                                onClick={() => archiveAccount(compte)}
                            >
                                Archiver
                            </Button>
                        </>
                    )}

                    {compte.statut === "BLOQUE" && (
                        <>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<LockOpenRoundedIcon />}
                                onClick={() => unblockAccount(compte)}
                            >
                                Débloquer
                            </Button>

                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<Inventory2RoundedIcon />}
                                onClick={() => archiveAccount(compte)}
                            >
                                Archiver
                            </Button>
                        </>
                    )}

                    {compte.statut === "SUPPRIME" && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<Inventory2RoundedIcon />}
                            onClick={() => restoreAccount(compte)}
                        >
                            Restaurer
                        </Button>
                    )}

                    <Button
                        variant="outlined"
                        startIcon={<CreditCardRoundedIcon />}
                        onClick={() => editLimit(compte)}
                    >
                        Modifier limite
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<PictureAsPdfRoundedIcon />}
                        onClick={() => viewHistory(compte)}
                    >
                        Rapport PDF
                    </Button>

                            </Stack>

                        </CardContent>

                    </Card>

                    ))}

                        </Stack>

                    </DialogContent>

                    <DialogActions
                        sx={{
                            px: 3,
                            py: 2,
                            justifyContent: "space-between"
                        }}
                    >

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {user.comptes?.length || 0} compte(s) bancaire(s)
                        </Typography>

                        <Button
                            variant="contained"
                            onClick={onClose}
                        >
                            Fermer
                        </Button>

                    </DialogActions>

                    </Dialog>

                        );

                    }

            