export default function MarketingLoading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 animate-spin rounded-full border-4 border-champagne border-t-transparent" />
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  )
}
