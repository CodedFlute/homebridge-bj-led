const noble = require("@abandonware/noble");
noble.on("stateChange", (state) => {
  if (state === "poweredOn") {
    noble.startScanningAsync();
  } else {
    if (this.peripheral) this.peripheral.disconnect();
    this.connected = false;
  }
});

function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function log(message) {
  console.log(`[@codedflute/homebridge-bj-led-ble]:`, message);
}

module.exports = class Device {
  constructor(uuid) {
    this.uuid = uuid;
    this.connected = false;
    this.power = false;
    this.brightness = 100;
    this.hue = 0;
    this.saturation = 0;
    this.l = 0.5;
    this.peripheral = undefined;
    this.r = 1;
    this.g = 1;
    this.b = 1;

    noble.on("stateChange", (state) => {
      if (state == "poweredOn") {
        noble.startScanningAsync();
      } else {
        if (this.peripheral) this.peripheral.disconnect();
        this.connected = false;
      }
    });

    noble.on("discover", async (peripheral) => {
      console.log(
        "[@codedflute/homebridge-bj-led-ble]:",
        peripheral.uuid,
        peripheral.advertisement.localName
      );
      if (peripheral.uuid == this.uuid) {
        this.peripheral = peripheral;
        noble.stopScanning();
      }
    });
  }

  async connectAndGetWriteCharacteristics() {
    if (!this.peripheral) {
      noble.startScanningAsync();
      return;
    }
    log(`Connecting to ${this.peripheral.uuid}...`);
    await this.peripheral.connectAsync();
    log(`Connected`);
    this.connected = true;
    const { characteristics } =
      await this.peripheral.discoverSomeServicesAndCharacteristicsAsync(
        ["ee01"],
        ["ee02"]
      );
    this.write = characteristics[0];
  }

  async debounceDisconnect() {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (this.peripheral) {
          log("Deconnecting...");
          await this.peripheral.disconnectAsync();
          log("Deconnected");
          this.connected = false;
        }
      }, 5000);
    };
  }

  async set_power(status) {
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (this.write) {
      if (status == true) {
      const buffer = Buffer.from(
        `6996060101ffffff7f`,
        "hex"
      )};
      if (status == false) {
      const buffer = Buffer.from(
        `6996020100`,
        "hex"
      )}
      log(buffer);
      this.write.write(buffer, true, (err) => {
        if (err) console.log("Error:", err);
        this.power = status;
        this.debounceDisconnect();
      });
    }
  }

  async set_brightness(level) {
    if (level > 100 || level < 0) return;
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (this.write) {
      this.hue = hue;
      const rgb = hslToRgb(hue / 360, this.saturation / 100, level / 100);
      this.set_rgb(rgb[0], rgb[1], rgb[2]);
      this.debounceDisconnect();
    };
  }

  async set_rgb(r, g, b) {
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (this.write) {
      const rhex = ("0" + r.toString(16)).slice(-2);
      const ghex = ("0" + g.toString(16)).slice(-2);
      const bhex = ("0" + b.toString(16)).slice(-2);
      const buffer = Buffer.from(`69960502${rhex}${ghex}${bhex}ff`, "hex");
      log(buffer);
      console.log("Packet sent:", buffer.toString("hex")); // Log the packet sent
      this.write.write(buffer, true, (err) => {
        if (err) console.log("Error:", err);
        this.debounceDisconnect();
      });
    }
  }

  async set_hue(hue) {
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (this.write) {
      this.hue = hue;
      const rgb = hslToRgb(hue / 360, this.saturation / 100, this.l);
      this.set_rgb(rgb[0], rgb[1], rgb[2]);
      this.debounceDisconnect();
    }
  }

  async set_saturation(saturation) {
    if (!this.connected) await this.connectAndGetWriteCharacteristics();
    if (this.write) {
      this.saturation = saturation;
      const rgb = hslToRgb(this.hue / 360, saturation / 100, this.l);
      this.set_rgb(rgb[0], rgb[1], rgb[2]);
      this.debounceDisconnect();
    }
  }
};