// DEMO ONLY. Never forward orders, collect card data, or present this as a live checkout.
const PRODUCTS = Object.freeze({
  solar:{name:'Solar Fan Straw Hat',price:4999},
  jacket:{name:'Lightweight Work Jacket',price:7999},
  tumbler:{name:'Stainless Tumbler (20 oz)',price:2999},
  trucker:{name:'Trucker Hat (Black/Red)',price:2499},
  hoodie:{name:'Premium Hoodie',price:4999},
  tee:{name:'T-Shirt (Black)',price:2499},
  cloth:{name:'Microfiber Glass Cloth',price:999},
  stickers:{name:'Decal Sticker Pack (3-Pack)',price:899}
});
const CART_KEY='big-john-merch-demo-cart-v1';
const $=id=>document.getElementById(id);
const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
let cart={};
try {
  const value=JSON.parse(sessionStorage.getItem(CART_KEY)||'{}');
  for(const [sku,qty] of Object.entries(value)) if(PRODUCTS[sku]&&Number.isSafeInteger(qty)&&qty>0&&qty<=99) cart[sku]=qty;
}catch { cart={}; }
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const subtotal=()=>Object.entries(cart).reduce((a,[sku,qty])=>a+PRODUCTS[sku].price*qty,0);
function save(){try { sessionStorage.setItem(CART_KEY,JSON.stringify(cart)); } catch { /* Cart remains usable for this page visit. */ }}
function setMinimized(minimized) {
  $('cart').classList.toggle('minimized', minimized);
  $('cart-collapse').textContent = minimized ? '+' : '−';
  $('cart-collapse').setAttribute('aria-label', minimized ? 'Expand cart' : 'Minimize cart');
  $('cart-collapse').setAttribute('aria-expanded', String(!minimized));
}
function setQuantity(sku,qty){
  if(!PRODUCTS[sku]) return;
  if(qty<=0) delete cart[sku]; else cart[sku]=Math.min(99,qty);
  const focusedLabel = document.activeElement?.getAttribute('aria-label');
  const focusedInCart = $('cart-items').contains(document.activeElement);
  save(); render();
  if (focusedInCart) {
    const buttons = [...$('cart-items').querySelectorAll('button')];
    (buttons.find(button => button.getAttribute('aria-label') === focusedLabel) ?? buttons[0] ?? $('cart-collapse')).focus();
  }
}
function element(tag,cl,text){const e=document.createElement(tag);if(cl)e.className=cl;if(text!==undefined)e.textContent=text;return e;}
function render(){
  $('cart-count').textContent=`(${count()})`;
  $('subtotal').textContent=money(subtotal());
  $('checkout').disabled = count() === 0;
  const container=$('cart-items'); container.replaceChildren();
  if(!count()){container.append(element('p','empty-cart','Your cart is empty. Choose an item from the catalog to begin.'));return;}
  for(const [sku,qty] of Object.entries(cart)){
    const p=PRODUCTS[sku], row=element('div','item'), body=element('div');
    body.append(element('strong','',p.name),element('small','',`${money(p.price)} each`));
    const controls=element('div','item-controls');
    const minus=element('button','', '−');minus.type='button';minus.setAttribute('aria-label',`Remove one ${p.name}`);minus.onclick=()=>setQuantity(sku,qty-1);
    const num=element('b','',String(qty));
    const plus=element('button','', '+');plus.type='button';plus.setAttribute('aria-label',`Add one ${p.name}`);plus.onclick=()=>setQuantity(sku,qty+1);
    controls.append(minus,num,plus);body.append(controls);
    const right=element('div');right.append(element('strong','',money(qty*p.price)));
    const remove=element('button','remove','×');remove.type='button';remove.setAttribute('aria-label',`Remove ${p.name}`);remove.onclick=()=>setQuantity(sku,0);right.append(remove);
    row.append(body,right);container.append(row);
  }
}
for (const button of document.querySelectorAll('[data-sku]')) {
  button.addEventListener('click', () => {
    const sku = button.dataset.sku;
    setQuantity(sku, (cart[sku] || 0) + 1);
    setMinimized(false);
  });
}
$('cart-open').addEventListener('click', () => {
  setMinimized(false);
  $('cart-collapse').focus();
});
$('cart-collapse').addEventListener('click', () => {
  setMinimized(!$('cart').classList.contains('minimized'));
});
$('continue').addEventListener('click', () => {
  setMinimized(true);
  $('cart-collapse').focus();
});
$('checkout').addEventListener('click',()=>{
  if(!count()) return;
  $('checkout-summary').textContent=`${count()} item(s) · ${money(subtotal())} subtotal before shipping and taxes.`;
  $('checkout-dialog').showModal();
});
render();

$('checkout-close').addEventListener('click', () => $('checkout-dialog').close());
setMinimized(false);
