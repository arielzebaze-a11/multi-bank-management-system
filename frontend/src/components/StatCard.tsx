import {
  Card,
  CardContent,
  Typography,
  Box
} from "@mui/material";

import type { ReactNode } from "react";

type Props = {

    title:string;

    value:string|number;

    color:string;

    icon:ReactNode;

};

export default function StatCard({

    title,

    value,

    color,

    icon

}:Props){

    return(

        <Card

            elevation={0}

            sx={{

                borderRadius:4,

                p:1,

                transition:".25s",

                border:"1px solid #E5E7EB",

                "&:hover":{

                    transform:"translateY(-5px)",

                    boxShadow:"0 12px 30px rgba(0,0,0,.08)"

                }

            }}

        >

            <CardContent>

                <Box

                    sx={{

                        display:"flex",

                        justifyContent:"space-between",

                        alignItems:"center"

                    }}

                >

                    <Box>

                        <Typography
                            
                            color="text.secondary"
                            sx={{
                                fontWeight: 700
                            }}
                        >

                            {title}

                        </Typography>

                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 700
                            }}
                        >

                            {value}

                        </Typography>

                    </Box>

                    <Box

                        sx={{

                            width:60,

                            height:60,

                            bgcolor:color,

                            color:"white",

                            display:"flex",

                            justifyContent:"center",

                            alignItems:"center",

                            borderRadius:3

                        }}

                    >

                        {icon}

                    </Box>

                </Box>

            </CardContent>

        </Card>

    );

}