import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  makeStyles,
  Popover
} from '@material-ui/core';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const useStyles = makeStyles((theme) => ({
  root: {},
  name: {
    marginTop: theme.spacing(1)
  },
  avatar: {
    height: 100,
    width: 100
  },

}));

const ProfileDetails = ({ className, user, userImage, ...rest }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = React.useState([]);
  const [Image, setImage] = React.useState('')

  const arrayBufferToBase64 = (buffer) => {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach((b) => binary += String.fromCharCode(b));
    return window.btoa(binary);
};

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const refreshPage = () => {
    window.location.reload(false);
  }

  const fileUpload = async (e) => {
    let img = e.target.files[0]
    setFile(img)
    let formData = new FormData();
    formData.append("file", file )
    formData.append("email", user.email)
    const optionsImage = {
      headers: { 
        
        "Content-Type": "multipart/form-data"
      },

      withCredentials: true,
      
    };
    const {data} = await axios.post('http://localhost:5001/UserImageUpload/',formData, optionsImage);
    console.log(data)
  }


  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;


  const IMAGE_UPLOAD = gql `
  mutation uploadd($image: Upload!, $email: String!){
    UserImageUpload(image: $image, email: $email){
      success
    }
  }
  `;
  const [mutate] = useMutation(IMAGE_UPLOAD);

  function onChange({
    target: {
      validity,
      files: [image],
    }
  }) {
    if (validity.valid){
      mutate({variables: {image: image, email: user.email}}).then((res) => {
        console.log(res)
        if (res.data.UserImageUpload.success === true){
          enqueueSnackbar("sucessfully updated image", {
            variant: 'success'
          });
        }else {
          enqueueSnackbar("Failed to Upload Image", {
            variant: 'error'
          });
        }
      });

    }
  }

  const setEMPImage = () => {
  
    var base64Flag = `data:${userImage.data.contentType};base64,`;
    var imgData = arrayBufferToBase64(userImage.data.data.data);
    setImage(base64Flag + imgData);
  }

  React.useEffect(() => {
    setEMPImage();
  }, [setEMPImage]);

  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          flexDirection="column"
          textAlign="center"
        >
          
          <Avatar
            className={classes.avatar}
            src={Image}
          />
          <Typography
            className={classes.name}
            color="textPrimary"
            gutterBottom
            variant="h3"
          >
            {user.name}
          </Typography>
        </Box>
      </CardContent>

      <div>
      
        <Button
          fullWidth
          variant="text"
          onClick={handleClick}
        >
          Add picture
        </Button>
     
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <input type="file" onChange={fileUpload} ></input>
        <Button
          fullWidth
          variant="text"
          onClick={refreshPage}
        >
           submit
        </Button>

      </Popover>
    </div>
      <CardActions>
        <Button
          fullWidth
          variant="text"
        >
          Remove picture
        </Button>
      </CardActions>
    </Card>
  );
};

ProfileDetails.propTypes = {
  className: PropTypes.string,
  user: PropTypes.object.isRequired
};

export default ProfileDetails;
