// Import Router from Express to handle modular routing
import { Router } from 'express';

// Import individual module route handlers
import { UserRoutes } from './user.routes';
import { AuthRoutes } from './auth.routes';
import { CategoryRoutes } from './category.routes';
import { TransactionRoutes } from './transaction';
import { ProductRoutes } from './product.routes';
import { CustomerRoutes } from './customer.routes';
import { OrderRoutes } from './order.routes';

// Initialize the main Express Router instance
const router = Router();

// Define an array mapping base URL paths to their respective feature route modules
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

// Iterate through the module routes array and register each route prefix dynamically
moduleRoutes.forEach((route) => router.use(route.path, route.route));

// Export the main router configuration to be used in the application
export default router;