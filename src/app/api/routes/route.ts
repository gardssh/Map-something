import { createRoute, getRoutes, deleteRoute, updateRoute } from '@/features/map/api/routes/route';

export async function POST(request: Request) {
  return createRoute(request);
}

export async function GET() {
  return getRoutes();
}

export async function DELETE(request: Request) {
  return deleteRoute(request);
}

export async function PATCH(request: Request) {
  return updateRoute(request);
} 