using System;
using System.Web.Mvc;
using System.IO;
using System.Text.RegularExpressions;

namespace CameraCapture.Controllers
{
    public class CameraController : Controller
    {
        [HttpGet]
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public ActionResult Upload(string id)
        {
            for(int i = 0; i < Request.Form.Count; i++) {
                string imageName = "Image" + i;
                string imageData = Request.Form[imageName];
                string base64Data = Regex.Match(imageData, @"data:image/(?<type>.+?),(?<data>.+)").Groups["data"].Value;

                string fileNameWitPath = @"~/Content/Upload/" + DateTime.Now.ToString().Replace("/", "-").Replace(" ", "-").Replace(":", "") + "-" + imageName + ".png";
                FileStream fs = new FileStream(Server.MapPath(fileNameWitPath), FileMode.Create);
                BinaryWriter bw = new BinaryWriter(fs);
                try
                {

                    byte[] data = Convert.FromBase64String(base64Data);
                    bw.Write(data);
                    bw.Close();
                } catch(Exception e)
                {

                } finally
                {
                    bw.Dispose();
                    fs.Dispose();
                }
            }

            return Json(new {Sucess = true}, "text/html");
        }
    }
}