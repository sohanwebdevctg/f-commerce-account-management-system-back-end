import { Router } from "express";
import { UseRouters } from "./user.routes";
import { AuthRoutes } from "./auth.routes";
import { CategoryRoutes } from "./category.routes";
import { TransactionRoutes } from "./transaction.routes";
import { ProductRoutes } from "./product.routes";


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
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
  path: "/transactions",
  route: TransactionRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;