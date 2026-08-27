import { Navigate, type RouteObject } from 'react-router-dom'
import Login from '@/pages/Login'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Users from '@/pages/Users'
import UserDetail from '@/pages/UserDetail'
import ExportPage from '@/pages/ExportPage'
import NotFound from '@/pages/NotFound'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('admin_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'users/:id',
        element: <UserDetail />,
      },
      {
        path: 'export',
        element: <ExportPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]

export default routes
