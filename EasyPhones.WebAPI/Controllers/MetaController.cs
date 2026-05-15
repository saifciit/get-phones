using EasyPhones.Application.Constants;
using EasyPhones.Application.Wrappers;
using Microsoft.AspNetCore.Mvc;

namespace EasyPhones.WebAPI.Controllers;

[ApiController]
[Route("api/meta")]
public class MetaController : ControllerBase
{
    /// <summary>Get static metadata: allowed brands, cities, and condition values.</summary>
    [HttpGet]
    public ActionResult<ApiResponse> GetMeta()
    {
        return Ok(ApiResponse.Success(new
        {
            brands     = PhoneConstants.AllowedBrands,
            cities     = PhoneConstants.AllowedCities,
            conditions = PhoneConstants.Conditions
        }));
    }
}
