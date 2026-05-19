export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="py-6">
      <h1 className="text-2xl font-bold">Recipe</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Hero image, scaled ingredients, numbered steps and timer chips ship in
        Sprint 2.
      </p>
      <p className="text-muted-foreground mt-4 font-mono text-xs">id: {id}</p>
    </section>
  );
}
