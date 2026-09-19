"""Viewfold integration."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_DEBUG, DOMAIN, FRONTEND_URL, VERSION

type ViewfoldConfigEntry = ConfigEntry[None]

_FRONTEND_PATH = Path(__file__).parent / "frontend" / "viewfold.js"
_STATIC_REGISTERED = f"{DOMAIN}_static_registered"


async def async_setup_entry(hass: HomeAssistant, entry: ViewfoldConfigEntry) -> bool:
    """Set up Viewfold from a config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    if not domain_data.get(_STATIC_REGISTERED):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(FRONTEND_URL, str(_FRONTEND_PATH), cache_headers=True)]
        )
        domain_data[_STATIC_REGISTERED] = True

    debug_query = "&debug=1" if entry.options.get(CONF_DEBUG, False) else ""
    module_url = f"{FRONTEND_URL}?v={VERSION}{debug_query}"
    add_extra_js_url(hass, module_url)
    domain_data[entry.entry_id] = module_url
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ViewfoldConfigEntry) -> bool:
    """Unload a Viewfold config entry."""
    module_url = hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    if module_url:
        remove_extra_js_url(hass, module_url)
    return True


async def _async_options_updated(
    hass: HomeAssistant, entry: ViewfoldConfigEntry
) -> None:
    """Reload Viewfold after its options change."""
    await hass.config_entries.async_reload(entry.entry_id)
