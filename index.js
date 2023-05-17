require("dotenv").config();
const axios = require("axios");
const express = require("express");
const EventEmitter = require("events");
const cors = require("cors");
const crypto = require("crypto");
const { noAuthShipRock, AuthShipRock } = require("./api");

const data = require("./data.json");

const myEmitter = new EventEmitter();

function generateMailBody(name, order, ship) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Civsa</title>
    <style>
      /* Body styles */
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        padding: 0;
        background-color: #f2f2f2;
      }

      /* Header styles */
      .header {
        background-color: #003366;
        color: #ffffff;
        padding: 20px;
      }

      /* Logo styles */
      .logo {
        height: 60px;
        width: 60px;
      }

      /* Content styles */
      .content {
        background-color: #ffffff;
        padding: 20px;
      }

      /* Footer styles */
      .footer {
        background-color: #003366;
        color: #ffffff;
        padding: 20px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <!-- Header -->
    <div class="header">
      <img class="logo" src="https://civsa.in/assets/uploads/media-uploader/png-logo-011672403308.png" alt="Company Logo">
    </div>

    <!-- Content -->
    <div class="content">
      <h1>Oder Placed</h1>
      <p>Dear Team,</p>
      <p>An order ID: ${order} and shipment ID: ${ship}  has been placed by ${name}.</p>
      <p>Best regards,<br>Civsa</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>&copy; 2023 Civsa. All rights reserved.</p>
    </div>
  </body>
</html>`;
}

/* 
//myEmitter1.on("sms", ()=>{})
*/

myEmitter.on("myEvent", async (arg, arg1, arg2) => {
  try {
    const response = await AuthShipRock(arg).post(
      "/shipments/create/forward-shipment",
      arg1
    );
    // Send response back to the emitter
    myEmitter.emit("response", [response.data, arg2]);
  } catch (error) {
    // Handle any errors
    myEmitter.emit("error", error);
  }
});

const app = express();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

// Define a middleware function to log every request
const logger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
};

// Use the logger middleware for all requests
app.use(logger);

// Products route
app.get("/api/products/new", (req, res) => {
  const products = [
    {
      id: "1234-KAJSUDTM",
      name: "VEGAN PLANT PROTEIN CHOCOLATE",
      mrp: 1899.0,
      offerprice: 1399.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683986205/yxygmxesuxqvjkmegeir.png",
      },
    },
  ];

  res.json({ data: products });
});
app.get("/api/products/popular", (req, res) => {
  const products = [
    {
      id: "ssd-2141542431",
      name: "Curcumin",
      mrp: 1499.0,
      offerprice: 899.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683986415/ttolvhicfdeq5shjljab.jpg",
      },
    },
    {
      id: "bnst-3426647",
      name: "Joint Health Support",
      mrp: 1799.0,
      offerprice: 1199.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683986660/xkmeqikcamsgorbdnvrj.jpg",
      },
    },
    {
      id: "sb-87294523",
      name: "Pre And Probiotics",
      mrp: 1999.0,
      offerprice: 999.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683986780/eroiixnrtifncrhbqg1t.jpg",
      },
    },
    {
      id: "sc-4329784238765",
      name: "Daily Essentials",
      mrp: 949.0,
      offerprice: 570.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683986949/wethczrtrkhal1cmdj03.jpg",
      },
    },
    {
      id: "kbcp-824947873265",
      name: "Liver Care",
      mrp: 1499.0,
      offerprice: 1049.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683987073/oc82igirdvri5zm4om8r.jpg",
      },
    },
    {
      id: "1234-KAJSUDTH",
      name: "EPF - Energy, Power And Focus",
      mrp: 2999.0,
      offerprice: 1299.0,
      img: {
        url: "https://res.cloudinary.com/db58ap8dm/image/upload/v1683987189/att9xpmgbjbtqix02ddv.jpg",
      },
    },
  ];

  res.json({ data: products });
});

app.get("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const result = data.filter((ele) => ele["SKU"] === id);
  res.json({ data: result[0] });
});

app.get("/api/products", (req, res) => {
  res.json({ data: data });
});

app.post("/api/orders", async (req, res) => {
  try {
    const randomNum = crypto.randomBytes(4).readUInt32BE(0) % 1000000000;
    const now = new Date();
    const {
      cartItems,
      cartSubTotal,
      paymentConfirmation,
      name,
      email,
      phone,
      address1,
      address2,
      city,
      state,
      country,
      zip,
      length,
      breadth,
      height,
      weight,
    } = req.body;

    const order_items = cartItems.map((ele) => ({
      name: ele.orderName,
      sku: ele.orderSku,
      units: ele.units,
      selling_price: ele.orderSelling,
      discount: "",
      tax: "",
    }));

    const {
      data: { token },
    } = await noAuthShipRock.post("/auth/login", {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });

    const year = now.getFullYear().toString().padStart(4, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const date = now.getDate().toString().padStart(2, "0");
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");

    if (paymentConfirmation === "COD") {
      const dataTemp = JSON.stringify({
        order_id: randomNum,
        order_date: `${year}-${month}-${date} ${hours}:${minutes}`,

        pickup_location: "Ceego Labs",
        comment: "Orders made and produceed by cisva",
        billing_customer_name: name,
        billing_last_name: name,
        billing_address: address1,
        billing_address_2: address2,
        billing_city: city,
        billing_pincode: zip,
        billing_state: state,
        billing_country: country,
        billing_email: email,
        billing_phone: phone,
        shipping_is_billing: true,
        order_items,
        payment_method: "COD",
        sub_total: cartSubTotal,
        length,
        breadth,
        height,
        weight,
        shipping_customer_name: "",
        shipping_last_name: "",
        shipping_address: "",
        shipping_address_2: "",
        shipping_city: "",
        shipping_pincode: "",
        shipping_country: "",
        shipping_state: "",
        shipping_email: "",
        shipping_phone: "",
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
      });
      myEmitter.emit("myEvent", `${token}`, dataTemp, name);
      //myEmitter1.emit('sms', name, orderName, phone);
    } else {
      const dataTemp = JSON.stringify({
        order_id: randomNum,
        order_date: `${year}-${month}-${date} ${hours}:${minutes}`,
        pickup_location: "Ceego Labs",
        comment: "Orders made and produceed by cisva",
        billing_customer_name: name,
        billing_last_name: name,
        billing_address: address1,
        billing_address_2: address2,
        billing_city: city,
        billing_pincode: zip,
        billing_state: state,
        billing_country: country,
        billing_email: email,
        billing_phone: phone,
        shipping_is_billing: true,
        order_items,
        payment_method: "Prepaid",
        sub_total: cartSubTotal,
        length,
        breadth,
        height,
        weight,
        shipping_customer_name: "",
        shipping_last_name: "",
        shipping_address: "",
        shipping_address_2: "",
        shipping_city: "",
        shipping_pincode: "",
        shipping_country: "",
        shipping_state: "",
        shipping_email: "",
        shipping_phone: "",
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
      });
      myEmitter.emit("myEvent", `${token}`, dataTemp, name);
    }
    // Listener to receive the response
    myEmitter.on("response", (result) => {
      const [order, name] = result
      console.log("???", order, name);
     /**
      * await sendEmail(
    pdfFileLinks,
    "support@civsa.in",
    process.env.SENDGRID_SENDER_MAIL,
    "Order placed",
    process.env.SENDGRID_SENDER_MAIL,
    html
  );
      */
      res.status(200).json({ response: result });
    });

    // Listener to handle errors
    myEmitter.on("error", (error) => {
      res.status(500).json({ response: error });
    });
  } catch (err) {
    console.log(err);
    res.status(500);
  }
});

app.post("/create-charge", async (req, res) => {
  try {
    const { payment_method_id, amount, currency, description } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      payment_method: payment_method_id,
      amount,
      currency,
      description,
      confirm: true,
    });
    res.json({ response: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
});

// Start the server
app.listen(1337, "0.0.0.0", () => {
  console.log("Server started on port 1337");
});

async function downloadPDF(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
}

async function preparePayload(
  pdfFileLinks,
  toEmail,
  ccEmail,
  subject,
  fromEmail,
  body
) {
  const attachments = await Promise.all(
    pdfFileLinks.map(async (link) => {
      const pdfContent = await downloadPDF(link);
      return {
        content: pdfContent.toString("base64"),
        filename: link.substring(link.lastIndexOf("/") + 1),
        type: "application/pdf",
        disposition: "attachment",
      };
    })
  );
  if (ccEmail) {
    return {
      personalizations: [
        {
          to: [{ email: toEmail }],
          cc: [{ email: ccEmail }],
          subject: subject,
        },
      ],
      from: { email: fromEmail },
      content: [
        {
          type: "text/plain",
          value: body,
        },
      ],
      attachments: attachments,
    };
  } else {
    return {
      personalizations: [
        {
          to: [{ email: toEmail }],
          subject: subject,
        },
      ],
      from: { email: fromEmail },
      content: [
        {
          type: "text/plain",
          value: body,
        },
      ],
      attachments: attachments,
    };
  }
}

async function sendEmail(
  pdfFileLinks,
  toEmail,
  ccEmail,
  subject,
  fromEmail,
  body
) {
  try {
    const payload = await preparePayload(
      pdfFileLinks,
      toEmail,
      ccEmail,
      subject,
      fromEmail,
      body
    );
    const response = await axios.post(
      "https://api.sendgrid.com/v3/mail/send",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Email sent successfully!");
    console.log(response.data);
  } catch (error) {
    console.error("Error sending email:", error.response.data);
  }
}
