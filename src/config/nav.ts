
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  UserCog,
  Wrench,
  ShoppingCart,
  BarChart3,
  BrainCircuit, // Or Sparkles
  LogOut,
  Settings,
  Landmark, // Added for Financeiro
  // Calculator icon is kept for the header, but not for a nav item itself
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  role?: 'admin' | 'user'; // Optional role for visibility
  isBottom?: boolean; // To position items like Logout and Settings at the bottom
}

export const navItems: NavItem[] = [
  {
    title: 'Painel',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Financeiro', // New Finance Section
    href: '/financeiro',
    icon: Landmark,
  },
  {
    title: 'Clientes',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Produtos',
    href: '/products',
    icon: Package,
  },
  {
    title: 'Fornecedores',
    href: '/providers',
    icon: Truck,
  },
  {
    title: 'Usuários',
    href: '/users',
    icon: UserCog,
    role: 'admin', // Only visible to admins
  },
  {
    title: 'Ordens de Serviço',
    href: '/service-orders',
    icon: Wrench,
  },
  {
    title: 'Vendas no Balcão',
    href: '/counter-sales',
    icon: ShoppingCart,
  },
  {
    title: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Diagnóstico IA',
    href: '/ai-diagnostics',
    icon: BrainCircuit,
  },
  // Items to be placed at the bottom
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
    isBottom: true,
  },
];

