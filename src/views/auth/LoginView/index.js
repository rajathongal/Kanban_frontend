import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Link,
  Typography,
  makeStyles
} from '@material-ui/core';
import Page from 'src/components/Page';
import useAuth from 'src/hooks/useAuth';
import JWTLogin from './JWTLogin';

const methodIcons = {
  'JWT': '/static/images/jwt.svg'
};

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  },
  banner: {
    backgroundColor: theme.palette.background.paper,
    paddingBottom: theme.spacing(2),
    paddingTop: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  bannerChip: {
    marginRight: theme.spacing(2)
  },
  methodIcon: {
    height: 30,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2)
  },
  cardContainer: {
    paddingBottom: 80,
    paddingTop: 80,
  },
  cardContent: {
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    minHeight: 400
  },
  currentMethodIcon: {
    height: 40,
    '& > img': {
      width: 'auto',
      maxHeight: '100%'
    }
  }
}));

const LoginView = () => {
  const classes = useStyles();
  const { method } = useAuth();

  return (
    <Page
      className={classes.root}
      title="Login"
    >
      <div className={classes.banner}>
        <Container maxWidth="md">
          <Box
            alignItems="center"
            display="flex"
            justifyContent="center"
          >
            <Chip
              color="secondary"
              label="Kanban Board Login"
              size="small"
              className={classes.bannerChip}
            />
            <Box
              alignItems="center"
              display="flex"
            >
            </Box>
          </Box>
        </Container>
      </div>
      <Container
        className={classes.cardContainer}
        maxWidth="sm"
      >
        <Box
          mb={8}
          display="flex"
          justifyContent="center"
        >
        </Box>
        <Card>
          <CardContent className={classes.cardContent}>
            <Box
              alignItems="center"
              display="flex"
              justifyContent="space-between"
              mb={3}
            >
              <div>
                <Typography
                  color="textPrimary"
                  gutterBottom
                  variant="h2"
                >
                  Sign in
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                >
                  JWT Authentication
                </Typography>
              </div>
              <div className={classes.currentMethodIcon}>
                <img
                  alt="Auth method"
                  src={methodIcons[method]}
                />
              </div>
            </Box>
            <Box
              flexGrow={1}
              mt={3}
            >
              {method === 'JWT' && <JWTLogin /> }
            </Box>
            <Box my={3}>
              <Divider />
            </Box>
            <Link
              component={RouterLink}
              to="/register"
              variant="body2"
              color="textSecondary"
            >
              Create new account
            </Link>
          </CardContent>
        </Card>
      </Container>
    </Page>
  );
};

export default LoginView;
