import { Router } from 'express';
import { UserRoutes } from './user.routes';
import { AuthRoutes } from './auth.routes';
import { CategoryRoutes } from './category.routes';
import { TransactionRoutes } from './transaction';
import { ProductRoutes } from './product.routes';
import { CustomerRoutes } from './customer.routes';
import { OrderRoutes } from './order.routes';

const router = Router();

// Mapping routes for each module
const moduleRoutes = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/transactions',
    route: TransactionRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/customers',
    route: CustomerRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
];

// Registering all routes using a loop
moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;