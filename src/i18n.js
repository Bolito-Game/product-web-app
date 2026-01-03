// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      all_products: {
        title: "All Products",
        search_placeholder: "🔍 Search products by name...",
        no_results: "No products found matching ",
        show_all: "Show All Products",
        load_more: "Load More Products",
        loading: "Loading...",
        error: "Failed to fetch products. Please try again later."
      },
      categories: {
        title: "Product Categories",
        search_placeholder: "🔍 Search categories...",
        no_results: "No categories found matching ",
        show_all: "Show All Categories",
        load_more: "Load More Categories",
        loading_more: "Loading more categories...",
        fetch_error: "Failed to fetch categories.",
        no_products: "No products found in this category.",
        no_products_error: "Failed to load products for this category.",
        match_exact: "✅ Exact match",
        match_starts: "🔍 Starts with",
        match_contains: "📋 Contains",
        match_fuzzy: "🎯 {{score}}% match"
      },
      product_detail: {
        sku: "SKU",
        category: "Category",
        availability: "Availability",
        in_stock: "{{count}} in stock",
        in_stock_plural: "{{count}} in stock", 
        out_of_stock: "Out of Stock",
        quantity: "Quantity",
        add_to_cart: "Add to Cart",
        remove_from_cart: "Remove from Cart",
        pay_now: "Pay Now",
        no_description: "No description available.",
        untitled: "Untitled Product",
        inactive_message: "This product is currently inactive and cannot be purchased.",
        not_found: "Product not found",
        load_error: "Failed to load product"
      },
      cart: {
        title: "Your Shopping Cart",
        empty: "Your shopping cart is empty. 🛒",
        checkout_button: "Check Out {{count}} Product",
        checkout_button_plural: "Check Out {{count}} Products",
        item_added: "Item was added to the Shopping Cart!",
        item_removed: "Item was removed from the Shopping Cart.",
        items_cleared_after_checkout: "Items have been removed from your cart after successful checkout."
      },
      checkout: {
        title: "Checkout",
        total_due: "Total Due",
        order_summary: "Order Summary",
        paypal: "PayPal",
        credit_card: "Credit Card",
        empty: "Your checkout is empty.",
        no_items: "No items to check out. Redirecting...",
        all_unavailable: "All selected products are currently unavailable.",
        load_error: "Failed to load checkout data. Please try again.",
        product_not_found: "Product with SKU {{sku}} could not be found and was removed.",
        this_product: "This product",
        out_of_stock: "{{name}} is out of stock and was removed.",
        quantity_reduced: "Quantity for {{name}} was reduced to {{qty}} to match stock.",
        create_order_failed: "Failed to create order",
        create_order_error: "Failed to create order",
        capture_error: "Failed to capture order",
        payment_success: "Payment successful!",
        payment_failed: "Payment failed",
        payment_error: "An error occurred during payment.",
        in_stock: "In Stock",
        product: "Product",
        na: "N/A"
      },
      order_success: {
        title: "Thank You!",
        thank_you: "Thank You for Your Purchase!",
        payment_success: "Your payment has been successfully processed.",
        order_details: "Order Details",
        order_id: "Order ID",
        status: "Order Status",
        order_date: "Order Date",
        total_amount: "Total Amount",
        payer: "Payer",
        email: "Email",
        shipping_address: "Shipping Address",
        payee_email: "Payee Email",
        order_summary: "Order Summary",
        quantity: "Quantity",
        continue_shopping: "Continue Shopping",
        no_items: "No items in this order.",
        na: "N/A",
        date_not_available: "Date not available",
        invalid_date: "Invalid date",
        product: "Product",
        no_details: "No order details available. Redirecting...",
        save_error: "Failed to save order locally."
      },
      my_orders: {
        title: "My Orders",
        filter_label: "Filter by date:",
        all_dates: "All Dates",
        no_orders_yet: "No orders saved yet.",
        no_orders_date: "No orders on this date.",
        unknown_date: "Unknown Date",
        order: "{{count}} order",
        order_plural: "{{count}} orders", 
        view_details: "Details",
        delete: "Delete",
        load_more: "Load More Orders",
        continue_shopping: "Continue Shopping",
        load_error: "Failed to load orders.",
        delete_success: "Order deleted successfully.",
        delete_error: "Failed to delete order.",
        delete_confirm_title: "Delete Order?",
        delete_confirm_message: "This action cannot be undone.",
        cancel: "Cancel",
        order_alt: "Order {{id}}"
      },
      order_view: {
        title: "Order Details",
        order_details: "Order Details",
        order_id: "Order ID",
        status: "Order Status",
        order_date: "Order Date",
        total_amount: "Total Amount",
        payer: "Payer",
        email: "Email",
        shipping_address: "Shipping Address",
        payee_email: "Payee Email",
        order_summary: "Order Summary",
        quantity: "Quantity",
        back_to_orders: "Back to My Orders",
        no_items: "No items in this order.",
        na: "N/A",
        date_not_available: "Date not available",
        invalid_date: "Invalid date",
        product: "Product",
        not_found: "Order not found."
      },
      error_boundary: {
        title: "Something went wrong.",
        message: "We're sorry for the inconvenience. Please try refreshing the page or returning home.",
        go_home: "Go to Homepage"
      }
    }
  },
  es: {
    translation: {
      all_products: {
        title: "Todos los Productos",
        search_placeholder: "🔍 Buscar productos por nombre...",
        no_results: "No se encontraron productos para ",
        show_all: "Mostrar los productos",
        load_more: "Cargar más productos",
        loading: "Cargando...",
        error: "Error al cargar productos. Por favor, inténtelo de nuevo más tarde."
      },
      categories: {
        title: "Categorías de Productos",
        search_placeholder: "🔍 Buscar categorías...",
        no_results: "No se encontraron categorías para ",
        show_all: "Mostrar todas las categorías",
        load_more: "Cargar más categorías",
        loading_more: "Cargando más categorías...",
        fetch_error: "Error al cargar categorías.",
        no_products: "No se encontraron productos en esta categoría.",
        no_products_error: "Error al cargar productos de esta categoría.",
        match_exact: "✅ Coincidencia exacta",
        match_starts: "🔍 Comienza con",
        match_contains: "📋 Contiene",
        match_fuzzy: "🎯 {{score}}% coincidencia"
      },
      product_detail: {
        sku: "SKU",
        category: "Categoría",
        availability: "Disponibilidad",
        in_stock: "{{count}} disponibles",
        out_of_stock: "Agotado",
        quantity: "Cantidad",
        add_to_cart: "Añadir al Carrito",
        remove_from_cart: "Quitar del Carrito",
        pay_now: "Pagar Ahora",
        no_description: "No hay descripción disponible.",
        untitled: "Producto sin título",
        inactive_message: "Este producto está actualmente inactivo y no se puede comprar.",
        not_found: "Producto no encontrado",
        load_error: "Error al cargar el producto"
      },
      cart: {
        title: "Su Carrito de Compras",
        empty: "Su carrito de compras está vacío. 🛒",
        checkout_button: "Pagar {{count}} Producto",
        checkout_button_plural: "Pagar {{count}} Productos",
        item_added: "¡El artículo se agregó al carrito de compras!",
        item_removed: "El artículo fue eliminado del carrito de compras.",
        items_cleared_after_checkout: "Los artículos han sido eliminados de tu carrito tras completar el pago."
      },
      checkout: {
        title: "Pago",
        total_due: "Total a Pagar",
        order_summary: "Resumen del Pedido",
        paypal: "PayPal",
        credit_card: "Tarjeta de Crédito",
        empty: "Su carrito está vacío.",
        no_items: "No hay artículos para pagar. Redirigiendo...",
        all_unavailable: "Todos los productos seleccionados están actualmente no disponibles.",
        load_error: "Error al cargar los datos de pago. Por favor, inténtelo de nuevo.",
        product_not_found: "El producto con SKU {{sku}} no se encontró y fue eliminado.",
        this_product: "Este producto",
        out_of_stock: "{{name}} está agotado y fue eliminado.",
        quantity_reduced: "La cantidad de {{name}} se redujo a {{qty}} según el stock disponible.",
        create_order_failed: "Error al crear el pedido",
        create_order_error: "Error al crear el pedido",
        capture_error: "Error al capturar el pedido",
        payment_success: "¡Pago exitoso!",
        payment_failed: "Pago fallido",
        payment_error: "Ocurrió un error durante el pago.",
        in_stock: "En Stock",
        product: "Producto",
        na: "N/D"
      },
      order_success: {
        title: "¡Gracias!",
        thank_you: "¡Gracias por su compra!",
        payment_success: "Su pago ha sido procesado exitosamente.",
        order_details: "Detalles del Pedido",
        order_id: "ID del Pedido",
        status: "Estado del Pedido",
        order_date: "Fecha del Pedido",
        total_amount: "Importe Total",
        payer: "Pagador",
        email: "Correo Electrónico",
        shipping_address: "Dirección de Envío",
        payee_email: "Correo del Beneficiario",
        order_summary: "Resumen del Pedido",
        quantity: "Cantidad",
        continue_shopping: "Continuar Comprando",
        no_items: "No hay artículos en este pedido.",
        na: "N/D",
        date_not_available: "Fecha no disponible",
        invalid_date: "Fecha inválida",
        product: "Producto",
        no_details: "No hay detalles del pedido disponibles. Redirigiendo...",
        save_error: "Error al guardar el pedido localmente."
      },
      my_orders: {
        title: "Mis Pedidos",
        filter_label: "Filtrar por fecha:",
        all_dates: "Todas las Fechas",
        no_orders_yet: "Aún no hay pedidos guardados.",
        no_orders_date: "No hay pedidos en esta fecha.",
        unknown_date: "Fecha Desconocida",
        order: "{{count}} pedido",
        order_plural: "{{count}} pedidos",
        view_details: "Detalles",
        delete: "Eliminar",
        load_more: "Cargar Más Pedidos",
        continue_shopping: "Continuar Comprando",
        load_error: "Error al cargar los pedidos.",
        delete_success: "Pedido eliminado correctamente.",
        delete_error: "Error al eliminar el pedido.",
        delete_confirm_title: "¿Eliminar Pedido?",
        delete_confirm_message: "Esta acción no se puede deshacer.",
        cancel: "Cancelar",
        order_alt: "Pedido {{id}}"
      },
      order_view: {
        title: "Detalles del Pedido",
        order_details: "Detalles del Pedido",
        order_id: "ID del Pedido",
        status: "Estado del Pedido",
        order_date: "Fecha del Pedido",
        total_amount: "Importe Total",
        payer: "Pagador",
        email: "Correo Electrónico",
        shipping_address: "Dirección de Envío",
        payee_email: "Correo del Beneficiario",
        order_summary: "Resumen del Pedido",
        quantity: "Cantidad",
        back_to_orders: "Volver a Mis Pedidos",
        no_items: "No hay artículos en este pedido.",
        na: "N/D",
        date_not_available: "Fecha no disponible",
        invalid_date: "Fecha inválida",
        product: "Producto",
        not_found: "Pedido no encontrado."
      },
      error_boundary: {
        title: "Algo salió mal.",
        message: "Lamentamos los inconvenientes. Por favor, intente recargar la página o volver al inicio.",
        go_home: "Ir al Inicio"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'es'],
    detection: {
      order: ['querystring', 'navigator', 'htmlTag'], 
      caches: [],
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;