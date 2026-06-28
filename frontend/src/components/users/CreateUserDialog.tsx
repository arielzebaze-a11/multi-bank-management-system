import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Typography
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

type Props = {
    open: boolean;
    onClose: () => void;
    newUser: any;
    setNewUser: any;
    createUser: () => void;
    banks: any[];
};

export default function CreateUserDialog({

    open,

    onClose,

    newUser,

    setNewUser,

    createUser,
    
    banks

}:Props){

    return(

        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >

            <DialogTitle
                sx={{
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center"
                }}
            >

                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        alignItems: "center"
                    }}
                >

                    <AddRoundedIcon color="primary"/>

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight:700
                        }}
                    >
                        Nouvel utilisateur
                    </Typography>

                </Stack>

                <Button
                    color="inherit"
                    onClick={onClose}
                >
                    <CloseRoundedIcon/>
                </Button>

            </DialogTitle>

            <DialogContent>

                <Stack
                    spacing={3}
                    sx={{
                        mt:2
                    }}
                >

                    <TextField
                        fullWidth
                        label="Nom complet"
                        value={newUser.nom}
                        onChange={(e)=>
                            setNewUser({
                                ...newUser,
                                nom:e.target.value
                            })
                        }
                    />

                    <TextField
                        fullWidth
                        label="Adresse email"
                        value={newUser.email}
                        onChange={(e)=>
                            setNewUser({
                                ...newUser,
                                email:e.target.value
                            })
                        }
                    />

                    <TextField
                        fullWidth
                        label="Téléphone"
                        value={newUser.telephone}
                        onChange={(e)=>
                            setNewUser({
                                ...newUser,
                                telephone:e.target.value
                            })
                        }
                    />

                    <TextField
                        fullWidth
                        type="password"
                        label="Code PIN"
                        value={newUser.code_pin}
                        onChange={(e)=>
                            setNewUser({
                                ...newUser,
                                code_pin:e.target.value
                            })
                        }
                    />

                    <FormControl fullWidth>

                        <InputLabel>

                            Banque

                        </InputLabel>

                        <Select
                            label="Banque"
                            value={newUser.code_agence}
                            onChange={(e)=>
                                setNewUser({
                                    ...newUser,
                                    code_agence:e.target.value
                                })
                            }
                        >

                            {banks.map((bank:any)=>(

                                <MenuItem
                                    key={bank.bank_id}
                                    value={bank.code_agence}
                                >

                                    {bank.nom}

                                </MenuItem>

                            ))}

                        </Select>

                    </FormControl>

                </Stack>

            </DialogContent>

            <DialogActions>

                <Button
                    onClick={onClose}
                >
                    Annuler
                </Button>

                <Button
                    variant="contained"
                    size="large"
                    onClick={createUser}
                >
                    Créer l'utilisateur
                </Button>

            </DialogActions>

        </Dialog>

    );

}   