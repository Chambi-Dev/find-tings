import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ObjetoForm } from '@/components/objeto-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NuevoObjetoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reportar Objeto Encontrado</CardTitle>
          <CardDescription>
            Llena el formulario con los detalles del objeto que encontraste.
            Mientras más información proporciones, más fácil será que el dueño lo encuentre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ObjetoForm />
        </CardContent>
      </Card>
    </div>
  );
}
