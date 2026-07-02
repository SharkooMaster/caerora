"""Minimal, brand-styled HTML email templates (inline styles for client support)."""
from django.conf import settings

BRAND = {
    "ivory": "#FAF7F4",
    "espresso": "#2B2424",
    "rose": "#B88F93",
    "taupe": "#8D7470",
    "plum": "#5B3B4A",
}


def _order_url(order) -> str:
    site = getattr(settings, "SITE_URL", "").rstrip("/")
    return f"{site}/order/{order.number}" if site else ""


def _button(href: str, label: str) -> str:
    return f"""
      <div style="text-align:center;margin:28px 0 8px;">
        <a href="{href}" style="display:inline-block;background:{BRAND['espresso']};color:{BRAND['ivory']};
           text-decoration:none;padding:14px 34px;border-radius:999px;font-size:12px;
           letter-spacing:2px;text-transform:uppercase;">{label}</a>
      </div>
    """


def _wrapper(inner: str) -> str:
    return f"""
    <div style="background:{BRAND['ivory']};padding:40px 0;font-family:Georgia,'Times New Roman',serif;color:{BRAND['espresso']};">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #efe7e2;">
        <div style="padding:28px 36px;text-align:center;border-bottom:1px solid #f1e9e4;">
          <div style="font-size:26px;letter-spacing:6px;color:{BRAND['plum']};font-weight:600;">CAERORA</div>
          <div style="font-size:10px;letter-spacing:3px;color:{BRAND['taupe']};margin-top:6px;">BEAUTY. ELEVATED.</div>
        </div>
        <div style="padding:32px 36px;font-size:15px;line-height:1.7;">
          {inner}
        </div>
        <div style="padding:20px 36px;text-align:center;font-size:11px;color:{BRAND['taupe']};border-top:1px solid #f1e9e4;">
          Caerora &middot; You are receiving this email about your order.
        </div>
      </div>
    </div>
    """


def _items_table(order):
    rows = ""
    for item in order.items.all():
        rows += f"""
        <tr>
          <td style="padding:8px 0;">{item.product_name} <span style="color:{BRAND['taupe']};">/ {item.variant_name}</span> &times; {item.quantity}</td>
          <td style="padding:8px 0;text-align:right;">{order.currency.upper()} {item.line_total:.2f}</td>
        </tr>"""
    return rows


def order_confirmation_html(order) -> str:
    order_url = _order_url(order)
    button = _button(order_url, "View your order") if order_url else ""
    discount_row = ""
    if order.discount_total and order.discount_total > 0:
        label = f"Discount ({order.discount_code})" if order.discount_code else "Discount"
        discount_row = (
            f'<tr><td style="color:{BRAND["rose"]};">{label}</td>'
            f'<td style="text-align:right;color:{BRAND["rose"]};">'
            f"-{order.currency.upper()} {order.discount_total:.2f}</td></tr>"
        )
    inner = f"""
      <p>Hi {order.first_name},</p>
      <p>Thank you for your order. We are preparing it with care and will let you know the moment it ships.</p>
      <p style="margin-top:24px;font-size:13px;letter-spacing:2px;color:{BRAND['taupe']};">ORDER {order.number}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
        {_items_table(order)}
        <tr><td style="padding-top:14px;border-top:1px solid #eee;">Subtotal</td><td style="padding-top:14px;border-top:1px solid #eee;text-align:right;">{order.currency.upper()} {order.subtotal:.2f}</td></tr>
        {discount_row}
        <tr><td>Shipping ({order.shipping_method})</td><td style="text-align:right;">{order.currency.upper()} {order.shipping_total:.2f}</td></tr>
        <tr><td>Tax</td><td style="text-align:right;">{order.currency.upper()} {order.tax_total:.2f}</td></tr>
        <tr><td style="font-weight:bold;padding-top:8px;">Total</td><td style="font-weight:bold;text-align:right;padding-top:8px;">{order.currency.upper()} {order.total:.2f}</td></tr>
      </table>
      <p style="margin-top:24px;">Shipping to:<br>
        {order.full_name}<br>
        {order.address_line1} {order.address_line2}<br>
        {order.postal_code} {order.city}, {order.country}
      </p>
      {button}
      <p style="text-align:center;font-size:12px;color:{BRAND['taupe']};">
        You can check your order status and tracking any time on this page.
      </p>
    """
    return _wrapper(inner)


def order_shipped_html(order) -> str:
    order_url = _order_url(order)
    tracking = ""
    if order.tracking_number:
        tracking = f"""
        <p style="text-align:center;margin:20px 0 4px;">
          <span style="font-size:12px;letter-spacing:2px;color:{BRAND['taupe']};">TRACKING NUMBER</span><br>
          <strong style="font-size:18px;letter-spacing:1px;">{order.tracking_number}</strong>
        </p>"""
    button = _button(order_url, "Track your order") if order_url else ""
    inner = f"""
      <p>Hi {order.first_name},</p>
      <p>Great news - your Caerora order <strong>{order.number}</strong> is on its way.</p>
      {tracking}
      {button}
      <p>We hope you love it. Beauty, elevated.</p>
    """
    return _wrapper(inner)


def newsletter_html(body_html: str, unsubscribe_url: str = "") -> str:
    """Wrap admin-authored newsletter body in the branded shell with an
    unsubscribe footer (required for marketing email compliance)."""
    unsub = ""
    if unsubscribe_url:
        unsub = (
            f'<br><a href="{unsubscribe_url}" style="color:{BRAND["taupe"]};'
            'text-decoration:underline;">Unsubscribe</a>'
        )
    return f"""
    <div style="background:{BRAND['ivory']};padding:40px 0;font-family:Georgia,'Times New Roman',serif;color:{BRAND['espresso']};">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #efe7e2;">
        <div style="padding:28px 36px;text-align:center;border-bottom:1px solid #f1e9e4;">
          <div style="font-size:26px;letter-spacing:6px;color:{BRAND['plum']};font-weight:600;">CAERORA</div>
          <div style="font-size:10px;letter-spacing:3px;color:{BRAND['taupe']};margin-top:6px;">BEAUTY. ELEVATED.</div>
        </div>
        <div style="padding:32px 36px;font-size:15px;line-height:1.7;">
          {body_html}
        </div>
        <div style="padding:20px 36px;text-align:center;font-size:11px;color:{BRAND['taupe']};border-top:1px solid #f1e9e4;">
          Caerora &middot; You received this because you subscribed to Caerora updates.{unsub}
        </div>
      </div>
    </div>
    """


def admin_new_order_html(order) -> str:
    inner = f"""
      <p>New paid order <strong>{order.number}</strong></p>
      <p>{order.full_name} &middot; {order.email}<br>
      {order.address_line1}, {order.postal_code} {order.city}, {order.country}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">{_items_table(order)}</table>
      <p style="font-weight:bold;">Total: {order.currency.upper()} {order.total:.2f}</p>
    """
    return _wrapper(inner)
