"""Config flow for Viewfold."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import callback

from .const import CONF_DEBUG, DOMAIN


class ViewfoldConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Viewfold."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Create the single Viewfold entry."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Viewfold", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> ViewfoldOptionsFlow:
        """Return the options flow."""
        return ViewfoldOptionsFlow()


class ViewfoldOptionsFlow(config_entries.OptionsFlow):
    """Handle Viewfold options."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Manage Viewfold options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_DEBUG,
                    default=self.config_entry.options.get(CONF_DEBUG, False),
                ): bool
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema)
