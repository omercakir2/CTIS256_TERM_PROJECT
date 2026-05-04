async function removeItem(cartId) {
  if (!confirm("Bu ürünü sepetten silmek istediğinize emin misiniz?")) return;

  try {
    const response = await fetch(`/cart/remove/item/${cartId}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      const row = document.getElementById(`cart-row-${cartId}`);
      row.remove();
      updateGrandTotal();
    } else {
      alert("Hata: " + result.message);
    }
  } catch (error) {
    console.error("AJAX Hatası:", error);
    alert("Bağlantı hatası oluştu.");
  }
}
async function changeQuantity(cartId, action, normal_price, discounted_price) {
  try {
    const response = await fetch("/cart/update-quantity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartId, action }),
    });

    const data = await response.json();

    if (data.success) {
      const quantityElement = document.getElementById(`quantity-${cartId}`);
      quantityElement.innerText = data.newQuantity;

      updateRowTotal(cartId, normal_price, discounted_price, data.newQuantity);
      updateGrandTotal();
    }
  } catch (err) {
    console.error("Güncelleme hatası:", err);
  }
}
function updateRowTotal(cartId, normal_price, discounted_price, quantity) {
  const row = document.getElementById(`cart-row-${cartId}`);
  const discounted_span = row.querySelector(".discounted");
  const normal_span = row.querySelector(".normal");

  discounted_span.innerHTML = "$" + discounted_price * quantity;
  normal_span.innerHTML = "$" + normal_price * quantity;
}
function updateGrandTotal() {
  // 1. Tüm indirimli fiyatları (tekil ürün fiyatları) ve tüm toplam göstergelerini seçiyoruz
  const discounted_spans = document.querySelectorAll(".discounted");
  const total_displays = document.querySelectorAll(".total");

  let sum = 0;

  // 2. Tüm indirimli fiyatları topluyoruz
  discounted_spans.forEach((span) => {
    const price = parseFloat(span.textContent.replace(/[^\d.]/g, "")) || 0;
    sum += price;
  });

  const formattedTotal = "$" + sum.toFixed(2);
  total_displays.forEach((display) => {
    display.textContent = formattedTotal;
  });
}
async function purchase() {
  try {
    const response = await fetch(`/cart/clear`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      const container = document.getElementById("container");
      container.innerHTML = "";
      updateGrandTotal();
      notifySuccessPurchase();
      console.log(result.message);
    } else {
      console.log(result.message);
    }
  } catch (error) {
    console.log(error);
  }
}
function notifySuccessPurchase() {
  const target_div = document.getElementById("notification_div");
  target_div.innerHTML = `<div class="alert alert-dismissible alert-success">
                        <span id="notification_span">Your order has been successfully received!</span>
                      </div>`;
  setTimeout(() => {
    target_div.innerHTML = "";
  }, 5000);
}
