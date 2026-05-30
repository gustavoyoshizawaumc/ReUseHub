# Infraestrutura

Documentacao e templates de configuracao do servidor de producao do ReUseHub.

Esta pasta serve como fonte da verdade sobre como o ambiente de producao
esta configurado e contem o passo a passo para reconstruir tudo do zero
caso seja necessario (instancia nova, migracao de regiao, etc.).

Os arquivos aqui sao templates. Eles nao sao lidos automaticamente pela
aplicacao - servem apenas como referencia e ponto de partida.

Nunca commitar credenciais reais nos templates desta pasta.

---

## Visao geral da arquitetura em producao

```
Usuario
  |
  +-- https://www.reusehub.me  -->  Vercel (frontend React)
  |
  +-- https://api.reusehub.me  -->  Nginx (EC2)
                                      |
                                      +-->  Spring Boot (porta 8080)
                                              |
                                              +-->  AWS RDS (PostgreSQL)
                                              +-->  MongoDB Atlas
                                              +-->  AWS S3
                                              +-->  Resend (email)
```

| Componente                | Onde roda                       |
| ------------------------- | ------------------------------- |
| Frontend (React + Vite)   | Vercel                          |
| Backend (Spring Boot)     | EC2 (api.reusehub.me)           |
| Banco relacional          | AWS RDS (PostgreSQL)            |
| Banco NoSQL               | MongoDB Atlas                   |
| Storage de imagens        | AWS S3 (bucket reusehub-uploads)|
| Email transacional        | Resend                          |
| CI/CD                     | GitHub Actions                  |

---

## Estrutura desta pasta

```
infra/
├── README.md                  - este arquivo
├── ec2/
│   └── start.sh.example       - template do script de inicializacao
├── nginx/
│   └── reusehub.conf          - configuracao do reverse proxy
└── systemd/
    └── reusehub.service       - unit file para gerenciamento do processo
```

---

## Passo a passo: subir um EC2 novo do zero

### 1. Provisionar a instancia

- Tipo: t3.micro (ou t2.micro para free tier real)
- AMI: Ubuntu 24.04+ LTS
- Security Group: abrir portas 22, 80, 443, 8080
- Anexar a chave SSH (.pem) gerada no console da AWS

### 2. Acessar a instancia

```bash
ssh -i ~/caminho/para/chave.pem ubuntu@<IP_DA_INSTANCIA>
```

### 3. Instalar Java 21 e Nginx

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk nginx
```

### 4. Configurar o start.sh

```bash
# Copiar template para o EC2 (via SCP, do PC local)
scp -i chave.pem infra/ec2/start.sh.example ubuntu@<IP>:/home/ubuntu/start.sh

# No EC2, dar permissao e editar com as credenciais reais
chmod +x /home/ubuntu/start.sh
nano /home/ubuntu/start.sh
```

### 5. Subir o JAR inicial

```bash
# Build local
cd backend
./mvnw clean package -DskipTests

# Enviar para o EC2
scp -i chave.pem target/backend-0.0.1-SNAPSHOT.jar ubuntu@<IP>:/home/ubuntu/
```

### 6. Configurar o systemd

```bash
# Copiar template para o EC2
scp -i chave.pem infra/systemd/reusehub.service ubuntu@<IP>:/tmp/

# No EC2
sudo mv /tmp/reusehub.service /etc/systemd/system/reusehub.service
sudo systemctl daemon-reload
sudo systemctl enable reusehub
sudo systemctl start reusehub
sudo systemctl status reusehub
```

### 7. Configurar o Nginx

```bash
# Copiar template para o EC2
scp -i chave.pem infra/nginx/reusehub.conf ubuntu@<IP>:/tmp/

# No EC2
sudo mv /tmp/reusehub.conf /etc/nginx/sites-available/reusehub
sudo ln -s /etc/nginx/sites-available/reusehub /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Configurar SSL com Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.reusehub.me
```

O Certbot ajusta automaticamente o reusehub.conf com os certificados e
adiciona o bloco de redirect 80 para 443.

### 9. Apontar o DNS

No registrador de dominio (Namecheap, etc.):

- Registro A para api.reusehub.me apontando para o IP publico do EC2

### 10. Atualizar os Secrets do GitHub Actions

Caso o IP tenha mudado, atualizar o secret EC2_HOST no repositorio em
Settings, Secrets and variables, Actions, EC2_HOST.

---

## Pipeline de deploy

O deploy do backend e automatizado via GitHub Actions
(.github/workflows/deploy-backend.yml). A cada push no branch develop
com alteracoes em backend/, o pipeline:

1. Faz o build do JAR
2. Envia para o EC2 via SCP
3. Faz backup do JAR atual como backend-previous.jar
4. Substitui pelo JAR novo
5. Reinicia o servico via systemctl restart reusehub

Em caso de problema, o workflow rollback-backend.yml pode ser executado
manualmente para restaurar a versao anterior.

---

## Como atualizar este diretorio

Sempre que algum arquivo no servidor de producao for alterado
(start.sh, configs do Nginx, do systemd), os templates aqui devem ser
atualizados para refletir a mudanca. Isso garante que o passo a passo
acima continue funcionando.