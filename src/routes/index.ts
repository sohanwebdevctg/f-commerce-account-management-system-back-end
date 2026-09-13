import { Router } from "express";
import { UseRouters } from "./user.routes";
import { AuthRoutes } from "./auth.routes";


const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: UseRouters,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;