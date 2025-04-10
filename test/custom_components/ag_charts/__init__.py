"""The AG Charts integration."""
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

DOMAIN = "ag_charts"

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the AG Charts component."""
    return True 