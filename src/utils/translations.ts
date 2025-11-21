export const TRANSLATIONS = {
    en: {
        overview: "Overview", welcome: "Smart Tracking", totalSpent: "Total Spent",
        thisMonth: "This Month", scanTitle: "AI Scanner", scanDesc: "Scan receipts.",
        scanBtn: "Scan", recent: "Recent", seeAll: "See All", history: "History",
        trends: "Trends", settings: "Settings", home: "Home", language: "Language",
        currency: "Currency", theme: "Theme", save: "Save", update: "Update",
        delete: "Delete", items: "Items", merchant: "Merchant", total: "Total",
        date: "Date", category: "Category", breakdown: "Breakdown",
        monthView: "Monthly", yearView: "Yearly", compareView: "Compare",
        compare: "Compare", vs: "vs", diff: "Diff", dailySpending: "Daily",
        monthlySpending: "Monthly", noData: "No Data", addPhoto: "Add Photo",
        confirmDup: "Duplicate?", unknown: "Unknown", newTrans: "New",
        editTrans: "Edit", tryAgain: "Retry", noItems: "No items.",
        filterHint: "Drill down", filterHintBack: "Back", addItem: "Add",
        itemName: "Name", itemPrice: "Price", itemSub: "Type", itemCat: "Group",
        backToCat: "Back", transactions: "Transactions", alias: "Alias",
        dateFormat: "Date Format", wipe: "Factory Reset", wipeConfirm: "Delete ALL data?",
        cleaning: "Cleaning...", cleaned: "Cleaned!", export: "Export CSV",
        exportAll: "Export All", prev: "Prev", next: "Next", page: "Page",
        monthsBreakdown: "Monthly Breakdown", allTime: "All Time", login: "Login",
        signin: "Sign in with Google", signout: "Sign Out"
    },
    es: {
        overview: "Resumen", welcome: "Rastreo Inteligente", totalSpent: "Total Gastado",
        thisMonth: "Este Mes", scanTitle: "Escáner IA", scanDesc: "Escanea boletas.",
        scanBtn: "Escanear", recent: "Reciente", seeAll: "Ver Todo", history: "Historial",
        trends: "Tendencias", settings: "Ajustes", home: "Inicio", language: "Idioma",
        currency: "Moneda", theme: "Tema", save: "Guardar", update: "Actualizar",
        delete: "Eliminar", items: "Ítems", merchant: "Comercio", total: "Total",
        date: "Fecha", category: "Categoría", breakdown: "Desglose",
        monthView: "Mensual", yearView: "Anual", compareView: "Comparar",
        compare: "Comparar", vs: "vs", diff: "Diferencia", dailySpending: "Diario",
        monthlySpending: "Mensual", noData: "Sin Datos", addPhoto: "Agregar Foto",
        confirmDup: "¿Duplicado?", unknown: "Desconocido", newTrans: "Nueva",
        editTrans: "Editar", tryAgain: "Reintentar", noItems: "Sin ítems.",
        filterHint: "Profundizar", filterHintBack: "Volver", addItem: "Agregar",
        itemName: "Nombre", itemPrice: "Precio", itemSub: "Tipo", itemCat: "Grupo",
        backToCat: "Volver", transactions: "Transacciones", alias: "Alias",
        dateFormat: "Formato Fecha", wipe: "Restablecer", wipeConfirm: "¿Borrar TODOS los datos?",
        cleaning: "Limpiando...", cleaned: "¡Listo!", export: "Exportar CSV",
        exportAll: "Exportar Todo", prev: "Ant", next: "Sig", page: "Pág",
        monthsBreakdown: "Desglose Mensual", allTime: "Histórico", login: "Ingresar",
        signin: "Entrar con Google", signout: "Cerrar Sesión"
    }
};

export type TranslationKey = keyof typeof TRANSLATIONS.en;
export type Language = keyof typeof TRANSLATIONS;
