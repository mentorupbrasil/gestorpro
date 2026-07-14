import { PageHeader, Surface } from "@/components/ui/page-chrome";

export function PageLoadError({
  description,
  detail,
  title,
}: Readonly<{
  description?: string;
  detail: string;
  title: string;
}>) {
  return (
    <div>
      {description ? (
        <PageHeader description={description} title={title} />
      ) : (
        <PageHeader title={title} />
      )}
      <div role="alert">
        <Surface className="border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Não foi possível carregar os dados</p>
          <p className="mt-1 text-sm text-red-800">{detail}</p>
        </Surface>
      </div>
    </div>
  );
}

export function describeSupabaseFailure(
  results: Array<{ error: { message: string; code?: string | undefined } | null }>,
  fallback: string,
) {
  const first = results.find((result) => result.error)?.error;
  if (!first) return fallback;
  return first.code
    ? `${fallback} (${first.code}: ${first.message})`
    : `${fallback}: ${first.message}`;
}
