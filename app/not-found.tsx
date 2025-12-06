export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Страница не найдена</p>
      <p className="text-md text-gray-500 dark:text-gray-400">
        К сожалению, такой страницы не существует или она была удалена.
      </p>
      <a
        href="/"
        className="mt-6 px-4 py-2 rounded bg-[#F5F2DD] text-gray-800 font-medium shadow-md hover:shadow-lg hover:bg-[#e9e6cc]"
      >
        Вернуться на главную
      </a>
    </div>
  );
}
