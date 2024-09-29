const express = require("express");
const app = express();
const { exec, execSync } = require('child_process');
const port = process.env.SERVER_PORT || process.env.PORT || 5000;        
const UUID = process.env.UUID || '45bb300c-9290-494f-8408-94ef1ebc81a5'; //若需要改UUID，需要在config.json里改为一致
const NEZHA_SERVER = process.env.NEZHA_SERVER || 'nz.f4i.cn';     
const NEZHA_PORT = process.env.NEZHA_PORT || '5555';                     // 哪吒端口为{443,8443,2096,2087,2083,2053}其中之一开启tls
const NEZHA_KEY = process.env.NEZHA_KEY || '5ddVS93Eq0Uc9he880';
const A2GO_DOMAIN = process.env.A2GO_DOMAIN || 'cheroffin.aufderhar.biz.id';     // 建议使用token，argo端口8080，cf后台设置需对应,使用json需上传json和yml文件至files目录
const A2GO_AUTH = process.env.A2GO_AUTH || 'eyJhIjoiMzEwYWU4Y2YwYTMwOGFlMjY3OWE1NjJhNGY4NjZhZTEiLCJ0IjoiZWZkMjc4ODItNGFlNS00N2EyLTg2OTItYzExNDQwYTlmYmRmIiwicyI6Ik56Y3pPRFJqTlRJdFpEWXlPQzAwTVRCa0xUZ3hZbUl0TURRMlltWTNZbVkzTVRkbCJ9';
const CFIP = process.env.CFIP || 'na.ma';
const NAME = process.env.NAME || 'Choreo';

// root route
app.get("/", function(req, res) {
  res.send("happy day !!");
});

const metaInfo = execSync(
  'curl -s https://speed.cloudflare.com/meta | awk -F\\" \'{print $26"-"$18}\' | sed -e \'s/ /_/g\'',
  { encoding: 'utf-8' }
);
const ISP = metaInfo.trim();

// sub subscription
app.get('/sub5', (req, res) => {
  const VMESS = { v: '2', ps: `${NAME}-${ISP}`, add: CFIP, port: '443', id: UUID, aid: '0', scy: 'none', net: 'ws', type: 'none', host: A2GO_DOMAIN, path: '/vmess?ed=2048', tls: 'tls', sni: A2GO_DOMAIN, alpn: '' };
  const vlessURL = `vless://${UUID}@${CFIP}:443?encryption=none&security=tls&sni=${A2GO_DOMAIN}&type=ws&host=${A2GO_DOMAIN}&path=%2Fvless?ed=2048#${NAME}-${ISP}`;
  const vmessURL = `vmess://${Buffer.from(JSON.stringify(VMESS)).toString('base64')}`;
  const trojanURL = `trojan://${UUID}@${CFIP}:443?security=tls&sni=${A2GO_DOMAIN}&type=ws&host=${A2GO_DOMAIN}&path=%2Ftrojan?ed=2048#${NAME}-${ISP}`;
  
  const base64Content = Buffer.from(`${vlessURL}\n\n${vmessURL}\n\n${trojanURL}`).toString('base64');

  res.type('text/plain; charset=utf-8').send(base64Content);
});

// run-nezha
  let NEZHA_TLS = '';
  if (NEZHA_SERVER && NEZHA_PORT && NEZHA_KEY) {
    const tlsPorts = ['443', '8443', '2096', '2087', '2083', '2053'];
    if (tlsPorts.includes(NEZHA_PORT)) {
      NEZHA_TLS = '--tls';
    } else {
      NEZHA_TLS = '';
    }
  const command = `nohup ./swith -s ${NEZHA_SERVER}:${NEZHA_PORT} -p ${NEZHA_KEY} ${NEZHA_TLS} >/dev/null 2>&1 &`;
  try {
    exec(command);
    console.log('swith is running');

    setTimeout(() => {
      runWeb();
    }, 2000);
  } catch (error) {
    console.error(`swith running error: ${error}`);
  }
} else {
  console.log('NEZHA variable is empty, skip running');
  runWeb();
}

// run-xr-ay
function runWeb() {
  const command1 = `nohup ./web -c ./config.json >/dev/null 2>&1 &`;
  exec(command1, (error) => {
    if (error) {
      console.error(`web running error: ${error}`);
    } else {
      console.log('web is running');

      setTimeout(() => {
        runServer();
      }, 2000);
    }
  });
}

// run-server
function runServer() {
  let command2 = '';
  if (A2GO_AUTH.match(/^[A-Z0-9a-z=]{120,250}$/)) {
    command2 = `nohup ./server tunnel --edge-ip-version auto --no-autoupdate --protocol http2 run --token ${A2GO_AUTH} >/dev/null 2>&1 &`;
  } else {
    command2 = `nohup ./server tunnel --edge-ip-version auto --config tunnel.yml run >/dev/null 2>&1 &`;
  }

  exec(command2, (error) => {
    if (error) {
      console.error(`server running error: ${error}`);
    } else {
      console.log('server is running');
    }
  });
}

app.listen(port, () => console.log(`App is listening on port ${port}!`));
