// Store recently viewed items
const addNewRecentlyViewedProduct = (currentProductHandle) => {
  let recentlyViewedArr =
    JSON.parse(localStorage.getItem("recentlyViewed")) || [];
  // Check for duplicates and limit the amount of products the block will show
  const productLimit = parseInt(
    document.querySelector(".recently-viewed").getAttribute("product-limit")
  );
  recentlyViewedArr = [
    currentProductHandle,
    ...recentlyViewedArr.filter((handle) => handle !== currentProductHandle),
  ].slice(0, productLimit + 1);
  localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewedArr));
};

// Fetch recently viewed products list
const getRecentlyViewedProducts = (currentProductHandle) => {
  const recentlyViewedArr =
    JSON.parse(localStorage.getItem("recentlyViewed")) || [];
  // Filter out current product from list
  return recentlyViewedArr.filter((handle) => handle !== currentProductHandle);
};

// Fetch product data
async function fetchProductDetails(productHandle) {
  try {
    const response = await fetch(`/products/${productHandle}.js`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
}

// Create upsell product card HTML
function createUpsellProductHTML(product) {
  const compareAtPrice = product.compare_at_price
    ? `<s class="upsell-product-compare-at-price">${formatMoney(
        product.compare_at_price
      )}</s>`
    : "";

  const hasMultipleVariants = product.variants.length > 1;

  let variantSelectionHTML = "";
  if (hasMultipleVariants) {
    const variantOptions = product.variants
      .map(
        (variant) =>
          `<option value="${variant.id}" ${
            !variant.available ? "disabled" : ""
          }>${variant.title} - ${
            variant.available ? formatMoney(variant.price) : "Sold Out"
          }</option>`
      )
      .join("");
    variantSelectionHTML = `
        <select name="id" class="recently-viewed__upsell-product--product-form__variants">
          ${variantOptions}
        </select>
      `;
  } else {
    variantSelectionHTML = `
        <input type="hidden" name="id" value="${product.variants[0].id}">
      `;
  }

  const isProductAvailable = product.variants.some(
    (variant) => variant.available
  );

  return `
      <div class="recently-viewed__upsell-product">
        <img src="${product.featured_image}?height=150&width=150" alt="${
    product.title
  }" class="recently-viewed__upsell-product-image">
        <div class="recently-viewed__upsell-content">
          <div class="recently-viewed__upsell-content--info">
            <h3 class="recently-viewed__upsell-product-title">${
              product.title
            }</h3>
            <p class="upsell-product-price">
              ${compareAtPrice}
              ${
                isProductAvailable
                  ? formatMoney(product.price)
                  : '<span class="sold-out">Sold Out</span>'
              }
            </p>
          </div>
          <a class="recently-viewed__upsell-content--product-link" href="${
            product.url
          }">Learn more</a>
          <product-form class="product-form" data-hide-errors="false">
            <div class="product-form__error-message-wrapper" role="alert" hidden="">
              <span class="svg-wrapper">
                <svg class="icon icon-error" viewBox="0 0 13 13">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#fff" stroke-width="2"></circle>
                  <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" stroke-width=".7"></circle>
                  <path fill="#fff" d="m5.874 3.528.1 4.044h1.053l.1-4.044zm.627 6.133c.38 0 .68-.288.68-.656s-.3-.656-.68-.656-.681.288-.681.656.3.656.68.656"></path>
                  <path fill="#fff" stroke="#EB001B" stroke-width=".7" d="M5.874 3.178h-.359l.01.359.1 4.044.008.341h1.736l.008-.341.1-4.044.01-.359H5.873Zm.627 6.833c.56 0 1.03-.432 1.03-1.006s-.47-1.006-1.03-1.006-1.031.432-1.031 1.006.47 1.006 1.03 1.006Z"></path>
                </svg>
              </span>
              <span class="product-form__error-message"></span>
            </div>
            <form method="post" action="/cart/add" accept-charset="UTF-8" class="form" enctype="multipart/form-data" novalidate="novalidate" data-type="add-to-cart-form">
              <input type="hidden" name="form_type" value="product">
              <input type="hidden" name="utf8" value="✓">
              ${variantSelectionHTML}
              <div class="product-form__buttons">
                <button type="submit" name="add" class="product-form__submit button button--full-width button--secondary" ${
                  !isProductAvailable ? "disabled" : ""
                } aria-haspopup="dialog">
                  <span>${
                    isProductAvailable ? "Add to cart" : "Sold Out"
                  }</span>
                  <div class="loading__spinner hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" class="spinner" viewBox="0 0 66 66">
                      <circle stroke-width="6" cx="33" cy="33" r="30" fill="none" class="path"></circle>
                    </svg>
                  </div>
                </button>
                ${
                  isProductAvailable
                    ? '<div data-shopify="payment-button" class="shopify-payment-button"></div>'
                    : ""
                }
              </div>
              <input type="hidden" name="product-id" value="${product.id}">
            </form>
          </product-form>
        </div>
      </div>
    `;
}

// Initialise recently viewed widget
const initRecentlyViewedUpsell = async () => {
  const currentProductHandle = document
    .querySelector(".recently-viewed")
    .getAttribute("product-handle");
  addNewRecentlyViewedProduct(currentProductHandle);

  const recentlyViewedHandles = getRecentlyViewedProducts(currentProductHandle);
  const upsellContainer = document.querySelector(".upsell-products-container");
  const recentlyViewedWrapper = document.querySelector(".recently-viewed");

  // Hide section if there are no products available to show
  if (recentlyViewedHandles.length > 0)
    recentlyViewedWrapper.style.display = "block";

  for (const productHandle of recentlyViewedHandles) {
    const productDetails = await fetchProductDetails(productHandle);
    const productHTML = createUpsellProductHTML(productDetails);
    upsellContainer.insertAdjacentHTML("beforeend", productHTML);
  }
};

// Initialise the upsell module when the DOM is ready
document.addEventListener("DOMContentLoaded", initRecentlyViewedUpsell);

function formatMoney(cents, format) {
  if (typeof Shopify !== "undefined" && Shopify.formatMoney) {
    return Shopify.formatMoney(cents, format);
  } else if (typeof window.theme !== "undefined" && window.theme.moneyFormat) {
    return window.theme.moneyFormat.replace(
      "{{amount}}",
      (cents / 100).toFixed(2)
    );
  } else {
    // Fallback formatting
    return "$" + (cents / 100).toFixed(2);
  }
}
