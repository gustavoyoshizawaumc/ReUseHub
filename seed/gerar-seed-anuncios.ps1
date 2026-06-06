param(
    [string]$UsuariosPath = "C:\Users\Guilherme Yoshizawa\Desktop\ReUseHub\seed-usuarios-1000.txt",
    [string]$OutputCsv = "C:\Users\Guilherme Yoshizawa\Desktop\ReUseHub\seed\seed-anuncios-400.csv",
    [string]$OutputJson = "C:\Users\Guilherme Yoshizawa\Desktop\ReUseHub\seed\seed-anuncios-400.json",
    [string]$OutputResumo = "C:\Users\Guilherme Yoshizawa\Desktop\ReUseHub\seed\seed-anuncios-resumo.txt"
)

$ErrorActionPreference = "Stop"

function Get-UsuariosSeed {
    param([string]$Path)

    $linhas = Get-Content $Path -Encoding UTF8
    if ($linhas.Count -lt 320) {
        throw "O arquivo precisa ter pelo menos 320 usuarios seedados."
    }

    return $linhas[0..319] | ForEach-Object {
        $partes = $_ -split ";\s*"
        [pscustomobject]@{
            indice = [int]$partes[0]
            nome = $partes[1]
            email = $partes[2]
        }
    }
}

function Get-Cidades {
    return @(
        @{
            nome = "Mogi das Cruzes"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Rua Professor Flaviano de Melo"; cep = "08710-000" },
                @{ bairro = "Centro"; logradouro = "Rua Doutor Correa"; cep = "08710-040" },
                @{ bairro = "Centro"; logradouro = "Rua Jose Bonifacio"; cep = "08710-070" },
                @{ bairro = "Centro"; logradouro = "Rua Doutor Ricardo Vilela"; cep = "08710-150" },
                @{ bairro = "Centro"; logradouro = "Rua Major Pinheiro Franco"; cep = "08710-220" },
                @{ bairro = "Centro"; logradouro = "Avenida Voluntario Fernando Pinheiro Franco"; cep = "08710-500" }
            )
        },
        @{
            nome = "Suzano"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Rua General Francisco Glicerio"; cep = "08674-000" },
                @{ bairro = "Centro"; logradouro = "Rua Benjamin Constant"; cep = "08674-010" },
                @{ bairro = "Centro"; logradouro = "Rua Campos Sales"; cep = "08674-020" },
                @{ bairro = "Centro"; logradouro = "Rua Felicio de Camargo"; cep = "08674-030" },
                @{ bairro = "Centro"; logradouro = "Rua Marechal Deodoro"; cep = "08674-070" },
                @{ bairro = "Centro"; logradouro = "Rua Mirambava"; cep = "08674-130" }
            )
        },
        @{
            nome = "Itaquaquecetuba"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Avenida Emancipacao"; cep = "08570-002" },
                @{ bairro = "Centro"; logradouro = "Rua Duque de Caxias"; cep = "08570-010" },
                @{ bairro = "Centro"; logradouro = "Rua Capitao Jose Leite"; cep = "08570-030" },
                @{ bairro = "Centro"; logradouro = "Rua Sebastiao Ferreira dos Santos"; cep = "08570-060" },
                @{ bairro = "Centro"; logradouro = "Rua Eugenio Brenn"; cep = "08570-090" },
                @{ bairro = "Centro"; logradouro = "Rua da Liberdade"; cep = "08570-170" }
            )
        },
        @{
            nome = "Poa"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Rua Marechal Floriano Peixoto"; cep = "08550-010" },
                @{ bairro = "Centro"; logradouro = "Rua Pedro Americo"; cep = "08550-040" },
                @{ bairro = "Centro"; logradouro = "Praca Santo Antonio"; cep = "08550-050" },
                @{ bairro = "Centro"; logradouro = "Avenida Nove de Julho"; cep = "08550-100" },
                @{ bairro = "Centro"; logradouro = "Rua Marina La Regina"; cep = "08550-210" },
                @{ bairro = "Centro"; logradouro = "Avenida Antonio Massa"; cep = "08550-350" }
            )
        },
        @{
            nome = "Ferraz de Vasconcelos"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Praca Independencia"; cep = "08500-010" },
                @{ bairro = "Centro"; logradouro = "Avenida Brasil"; cep = "08500-020" },
                @{ bairro = "Centro"; logradouro = "Rua Otavio Rodrigues Barbosa"; cep = "08500-410" },
                @{ bairro = "Vila Romanopolis"; logradouro = "Avenida Quinze de Novembro"; cep = "08500-405" },
                @{ bairro = "Vila Romanopolis"; logradouro = "Rua Sete de Setembro"; cep = "08529-300" },
                @{ bairro = "Jardim Ferrazense"; logradouro = "Rua Doutor Rodrigues Alves"; cep = "08502-050" }
            )
        },
        @{
            nome = "Aruja"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Rua Martins Fontes"; cep = "07400-550" },
                @{ bairro = "Centro"; logradouro = "Rua Monteiro Lobato"; cep = "07400-555" },
                @{ bairro = "Centro"; logradouro = "Avenida Antonio Afonso de Lima"; cep = "07400-560" },
                @{ bairro = "Centro"; logradouro = "Rua Rodrigues Alves"; cep = "07400-575" },
                @{ bairro = "Centro"; logradouro = "Rua Albino Rodrigues Neves"; cep = "07400-600" },
                @{ bairro = "Centro"; logradouro = "Avenida Joao Manoel"; cep = "07400-605" }
            )
        },
        @{
            nome = "Guarulhos"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Praca Presidente Getulio Vargas"; cep = "07010-000" },
                @{ bairro = "Centro"; logradouro = "Rua Joao Goncalves"; cep = "07010-010" },
                @{ bairro = "Centro"; logradouro = "Rua Felicio Marcondes"; cep = "07010-030" },
                @{ bairro = "Centro"; logradouro = "Rua Quinze de Novembro"; cep = "07011-030" },
                @{ bairro = "Centro"; logradouro = "Rua Doutor Ramos de Azevedo"; cep = "07012-020" },
                @{ bairro = "Centro"; logradouro = "Rua Luiz Faccini"; cep = "07110-000" }
            )
        },
        @{
            nome = "Sao Paulo"
            enderecos = @(
                @{ bairro = "Se"; logradouro = "Praca da Se"; cep = "01001-000" },
                @{ bairro = "Se"; logradouro = "Rua Direita"; cep = "01002-000" },
                @{ bairro = "Se"; logradouro = "Rua Jose Bonifacio"; cep = "01003-000" },
                @{ bairro = "Se"; logradouro = "Rua Quintino Bocaiuva"; cep = "01004-010" },
                @{ bairro = "Se"; logradouro = "Rua Benjamin Constant"; cep = "01005-000" },
                @{ bairro = "Se"; logradouro = "Rua Riachuelo"; cep = "01007-000" }
            )
        },
        @{
            nome = "Osasco"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Rua Dona Primitiva Vianco"; cep = "06016-000" },
                @{ bairro = "Centro"; logradouro = "Rua Ruy Barbosa"; cep = "06018-000" },
                @{ bairro = "Centro"; logradouro = "Avenida dos Autonomistas"; cep = "06090-010" },
                @{ bairro = "Centro"; logradouro = "Avenida Marechal Rondon"; cep = "06093-010" },
                @{ bairro = "Centro"; logradouro = "Rua Albino dos Santos"; cep = "06093-060" },
                @{ bairro = "Centro"; logradouro = "Avenida da Liberdade"; cep = "06110-050" }
            )
        },
        @{
            nome = "Barueri"
            enderecos = @(
                @{ bairro = "Centro"; logradouro = "Rua Campos Sales"; cep = "06401-000" },
                @{ bairro = "Centro"; logradouro = "Rua Duque de Caxias"; cep = "06401-010" },
                @{ bairro = "Centro"; logradouro = "Avenida Henriqueta Mendes Guerra"; cep = "06401-015" },
                @{ bairro = "Centro"; logradouro = "Avenida Vinte e Seis de Marco"; cep = "06401-050" },
                @{ bairro = "Centro"; logradouro = "Rua Doutor Joao Mendes"; cep = "06401-080" },
                @{ bairro = "Centro"; logradouro = "Rua do Paco"; cep = "06401-090" }
            )
        }
    )
}

function Get-Categorias {
    return @(
        @{ id = 21; nome = "Moveis"; itens = @("Cadeira de jantar de madeira", "Criado-mudo branco", "Poltrona de tecido", "Mesa lateral de apoio", "Estante pequena", "Rack de TV baixo", "Escrivaninha simples", "Sofa de 2 lugares", "Comoda de madeira", "Banqueta alta", "Sapateira pequena", "Mesa de centro") },
        @{ id = 5; nome = "Casa, Decoracao e Utensilios"; itens = @("Abajur de mesa", "Espelho decorativo", "Tapete de sala", "Kit de panelas", "Cesta organizadora", "Cortina blecaute", "Jogo de almofadas", "Vaso decorativo", "Relogio de parede", "Conjunto de pratos") },
        @{ id = 20; nome = "Eletro"; itens = @("Air fryer preta", "Liquidificador simples", "Ventilador de coluna", "Cafeteira eletrica", "Micro-ondas usado", "Ferro de passar", "Batedeira portatil", "Panela eletrica", "Sanduicheira grill", "Chaleira eletrica") },
        @{ id = 4; nome = "Celulares e Telefonia"; itens = @("Smartphone Android", "iPhone usado", "Celular intermediario", "Tablet Android", "Power bank", "Celular basico", "Aparelho com capa", "Kit de carregadores") },
        @{ id = 19; nome = "Informatica"; itens = @("Notebook intermediario", "Monitor LCD", "Teclado de escritorio", "Mouse optico", "Gabinete de PC", "Impressora compacta", "Roteador Wi-Fi", "HD externo", "Estabilizador", "Mochila para notebook") },
        @{ id = 18; nome = "Audio"; itens = @("Fone Bluetooth", "Caixa de som portatil", "Microfone dinamico", "Home theater antigo", "Par de caixas acusticas", "Headset usado", "Radio gravador", "Soundbar", "Receiver domestico") },
        @{ id = 16; nome = "Games"; itens = @("Console PS4 Slim", "Controle sem fio", "Lote de jogos", "Console Xbox One", "Headset gamer", "Teclado gamer", "Mouse gamer", "Volante de corrida", "Console retro", "Cadeira gamer usada") },
        @{ id = 15; nome = "Cameras e Drones"; itens = @("Camera DSLR de entrada", "Lente 50mm", "Camera instantanea", "Camera compacta", "Tripe de aluminio", "Action cam", "Filmadora antiga", "Mochila fotografica", "Flash externo") },
        @{ id = 6; nome = "Esportes e Fitness"; itens = @("Bicicleta ergometrica", "Par de halteres", "Colchonete de exercicios", "Skate completo", "Patins in-line", "Bola de futebol", "Raquete esportiva", "Mochila de hidratacao", "Capacete esportivo") },
        @{ id = 8; nome = "Moda e beleza"; itens = @("Bolsa casual", "Tenis usado", "Jaqueta jeans", "Secador de cabelo", "Chapinha", "Espelho de maquiagem", "Kit de pinceis", "Relogio de pulso", "Sapato social", "Paleta de maquiagem") },
        @{ id = 9; nome = "Artigos infantis"; itens = @("Carrinho de bebe", "Cadeirinha de carro", "Brinquedo educativo", "Bicicleta infantil", "Cadeira de alimentacao", "Tapete de atividades", "Lote de roupinhas", "Banheira plastica", "Andador infantil") },
        @{ id = 22; nome = "Materiais de Construcao"; itens = @("Furadeira usada", "Jogo de chaves", "Latas de tinta", "Rolos de pintura", "Escada de aluminio", "Caixa de ferramentas", "Sobras de piso", "Fios eletricos", "Serra tico-tico", "Lote de parafusos") }
    )
}

function New-AddressSlots {
    param($Cidade)

    $contagens = @(7, 7, 7, 7, 6, 6)
    $slots = New-Object System.Collections.Generic.List[object]
    $restante = $true

    while ($restante) {
        $restante = $false
        for ($i = 0; $i -lt $Cidade.enderecos.Count; $i++) {
            if ($contagens[$i] -gt 0) {
                $slots.Add($Cidade.enderecos[$i])
                $contagens[$i]--
                $restante = $true
            }
        }
    }

    return $slots
}

function New-ShuffledPool {
    param(
        [hashtable[]]$Itens,
        [int]$Seed
    )

    $lista = New-Object System.Collections.Generic.List[object]
    foreach ($item in $Itens) {
        for ($i = 0; $i -lt $item.quantidade; $i++) {
            $lista.Add([pscustomobject]@{
                api = $item.api
                label = $item.label
            })
        }
    }

    $random = [System.Random]::new($Seed)
    for ($i = $lista.Count - 1; $i -gt 0; $i--) {
        $j = $random.Next(0, $i + 1)
        $temp = $lista[$i]
        $lista[$i] = $lista[$j]
        $lista[$j] = $temp
    }

    return $lista
}

function Write-Utf8BomText {
    param(
        [string]$Path,
        [string[]]$Lines
    )

    $encoding = [System.Text.UTF8Encoding]::new($true)
    [System.IO.File]::WriteAllLines($Path, $Lines, $encoding)
}

function Get-FraseCondicaoTitulo {
    param([string]$CondicaoApi)

    switch ($CondicaoApi) {
        "NOVO" { return "em otimo estado" }
        "BOM" { return "em bom estado" }
        "REGULAR" { return "com uso domestico normal" }
        default { return "para reaproveitamento" }
    }
}

function Get-DescricaoResumida {
    param(
        [string]$Item,
        [string]$Categoria,
        [string]$CondicaoApi,
        [string]$TipoApi,
        [string]$Cidade,
        [string]$Bairro,
        [int]$Variacao
    )

    $frasesCondicao = switch ($CondicaoApi) {
        "NOVO" {
            @(
                "Item muito conservado, sem necessidade de ajustes imediatos.",
                "Pouco uso e aparencia bem preservada para o dia a dia.",
                "Peca em otimo estado visual e pronta para uso."
            )
        }
        "BOM" {
            @(
                "Item funcional e bem cuidado, pronto para uso no dia a dia.",
                "Apresenta sinais leves de uso, mas segue bem conservado.",
                "Peca usada com bom aspecto geral e funcionamento normal."
            )
        }
        "REGULAR" {
            @(
                "Item com marcas normais de uso, mas ainda util e aproveitavel.",
                "Apresenta desgaste compativel com uso domestico, mantendo utilidade.",
                "Produto usado com sinais visiveis, porem ainda funcional."
            )
        }
        default {
            @(
                "Item com desgaste maior, indicado para reaproveitamento ou pequenos reparos.",
                "Peca mais rodada, util para quem quer reutilizar ou ajustar.",
                "Produto com desgaste acentuado, mas ainda aproveitavel em contexto certo."
            )
        }
    }

    $frasesCategoria = switch ($Categoria) {
        "Moveis" {
            @(
                "Bom para compor quarto, sala ou area de estudo.",
                "Pode encaixar bem em ambientes domesticos de uso diario.",
                "Util para reaproveitar em espacos pequenos da casa."
            )
        }
        "Casa, Decoracao e Utensilios" {
            @(
                "Pode ser util para organizacao e uso domestico cotidiano.",
                "Boa opcao para complementar itens da casa sem gastar muito.",
                "Ajuda a compor ou renovar detalhes do ambiente."
            )
        }
        "Eletro" {
            @(
                "Adequado para rotina domestica e uso basico da casa.",
                "Pode atender bem tarefas simples do dia a dia.",
                "Interessante para quem busca utilidade sem foco em item novo."
            )
        }
        "Celulares e Telefonia" {
            @(
                "Pode servir bem como aparelho principal simples ou de apoio.",
                "Boa opcao para uso basico, reserva ou reaproveitamento.",
                "Util para quem precisa de item funcional sem buscar modelo novo."
            )
        }
        "Informatica" {
            @(
                "Pode atender estudos, tarefas simples ou uso domestico.",
                "Util para rotina de trabalho leve, pesquisa ou apoio em casa.",
                "Boa opcao para montar ou complementar um setup funcional."
            )
        }
        "Audio" {
            @(
                "Pode ser aproveitado em uso domestico, lazer ou apoio no dia a dia.",
                "Boa escolha para quem quer escutar, tocar ou montar algo simples.",
                "Item interessante para entretenimento ou uso casual em casa."
            )
        }
        "Games" {
            @(
                "Pode ser bem aproveitado em momentos de lazer e uso casual.",
                "Boa opcao para quem quer montar ou completar um setup gamer simples.",
                "Interessante para diversao domestica sem foco em item novo."
            )
        }
        "Cameras e Drones" {
            @(
                "Pode atender uso casual, estudos ou hobby com fotografia.",
                "Boa opcao para quem quer montar kit simples ou complementar acessorios.",
                "Item util para lazer, registro pessoal ou reaproveitamento."
            )
        }
        "Esportes e Fitness" {
            @(
                "Pode ser bem aproveitado em treinos, lazer ou atividade domestica.",
                "Boa escolha para quem quer manter rotina simples de exercicios.",
                "Util para uso casual e reaproveitamento esportivo."
            )
        }
        "Moda e beleza" {
            @(
                "Pode ser aproveitado no uso cotidiano ou para compor itens pessoais.",
                "Boa opcao para reaproveitamento com foco em utilidade e estilo basico.",
                "Interessante para rotina pessoal sem necessidade de peca nova."
            )
        }
        "Artigos infantis" {
            @(
                "Pode atender bem fase infantil e uso domestico da rotina.",
                "Boa opcao para reaproveitar item de crianca com foco em utilidade.",
                "Util para quem quer economizar em item de uso rapido."
            )
        }
        default {
            @(
                "Pode ser util para ajustes, pequenos projetos ou reaproveitamento.",
                "Boa opcao para quem quer item funcional sem foco em peca nova.",
                "Interessante para uso pratico e reaproveitamento domestico."
            )
        }
    }

    $frasesTipo = if ($TipoApi -eq "DOACAO") {
        @(
            "Disponivel para doacao.",
            "Anuncio voltado para doacao.",
            "Pode ser doado para quem realmente for usar."
        )
    } else {
        @(
            "Disponivel para troca por algo de utilidade semelhante.",
            "Aceita troca por item equivalente de interesse.",
            "Anuncio aberto para troca por algo util ao anunciante."
        )
    }

    $fraseCondicao = $frasesCondicao[$Variacao % $frasesCondicao.Count]
    $fraseCategoria = $frasesCategoria[($Variacao + 1) % $frasesCategoria.Count]
    $fraseTipo = $frasesTipo[($Variacao + 2) % $frasesTipo.Count]

    return "$Item. $fraseCondicao $fraseCategoria $fraseTipo Localizado em $Bairro, $Cidade."
}

$usuarios = Get-UsuariosSeed -Path $UsuariosPath
$cidades = Get-Cidades
$categorias = Get-Categorias

$tiposPool = New-ShuffledPool -Seed 20260605 -Itens @(
    @{ api = "DOACAO"; label = "Doacao"; quantidade = 240 },
    @{ api = "TROCA"; label = "Troca"; quantidade = 160 }
)

$condicoesPool = New-ShuffledPool -Seed 20260606 -Itens @(
    @{ api = "NOVO"; label = "Novo"; quantidade = 60 },
    @{ api = "BOM"; label = "Bem conservado"; quantidade = 200 },
    @{ api = "REGULAR"; label = "Regular"; quantidade = 120 },
    @{ api = "RUIM"; label = "Ruim"; quantidade = 20 }
)

$slotsPorCidade = @()
for ($i = 0; $i -lt $cidades.Count; $i++) {
    $slotsPorCidade += ,(New-AddressSlots -Cidade $cidades[$i])
}

$ponteirosCidade = @()
for ($i = 0; $i -lt $cidades.Count; $i++) {
    $ponteirosCidade += 0
}

$contadorItensCategoria = @{}
foreach ($categoria in $categorias) {
    $contadorItensCategoria[$categoria.id] = 0
}

$anuncios = New-Object System.Collections.Generic.List[object]
$globalIndex = 1

for ($userPos = 0; $userPos -lt 320; $userPos++) {
    $usuario = $usuarios[$userPos]

    if ($userPos -lt 260) {
        $qtdAnuncios = 1
        $bloco = "1-anuncio"
        $cidadeIndex = [math]::Floor($userPos / 26)
    } elseif ($userPos -lt 310) {
        $qtdAnuncios = 2
        $bloco = "2-anuncios"
        $cidadeIndex = [math]::Floor(($userPos - 260) / 5)
    } else {
        $qtdAnuncios = 4
        $bloco = "4-anuncios"
        $cidadeIndex = $userPos - 310
    }

    for ($ordemUsuario = 1; $ordemUsuario -le $qtdAnuncios; $ordemUsuario++) {
        $cidade = $cidades[$cidadeIndex]
        $slotIndex = [int]$ponteirosCidade[$cidadeIndex]
        $endereco = $slotsPorCidade[$cidadeIndex][$slotIndex]
        $ponteirosCidade[$cidadeIndex] = $slotIndex + 1

        $categoria = $categorias[($globalIndex - 1) % $categorias.Count]
        $itemIndex = $contadorItensCategoria[$categoria.id] % $categoria.itens.Count
        $item = $categoria.itens[$itemIndex]
        $contadorItensCategoria[$categoria.id] = $contadorItensCategoria[$categoria.id] + 1

        $tipo = $tiposPool[$globalIndex - 1]
        $condicao = $condicoesPool[$globalIndex - 1]
        $titulo = "$item $(Get-FraseCondicaoTitulo -CondicaoApi $condicao.api) - $($cidade.nome)"
        $descricao = Get-DescricaoResumida `
            -Item $item `
            -Categoria $categoria.nome `
            -CondicaoApi $condicao.api `
            -TipoApi $tipo.api `
            -Cidade $cidade.nome `
            -Bairro $endereco.bairro `
            -Variacao ($globalIndex % 7)

        $anuncios.Add([pscustomobject]@{
            anuncio_ordem_global = $globalIndex
            usuario_indice = ("{0:D4}" -f $usuario.indice)
            usuario_nome = $usuario.nome
            usuario_email = $usuario.email
            bloco_usuario = $bloco
            anuncios_do_usuario = $qtdAnuncios
            anuncio_ordem_do_usuario = $ordemUsuario
            cidade = $cidade.nome
            bairro = $endereco.bairro
            logradouro = $endereco.logradouro
            cep = $endereco.cep
            categoria_id = $categoria.id
            categoria = $categoria.nome
            tipo_api = $tipo.api
            tipo_label = $tipo.label
            condicao_api = $condicao.api
            condicao_label = $condicao.label
            titulo = $titulo
            descricao_resumida = $descricao
        })

        $globalIndex++
    }
}

$csvLines = $anuncios | ConvertTo-Csv -NoTypeInformation -Delimiter ';'
Write-Utf8BomText -Path $OutputCsv -Lines $csvLines

$jsonLines = ($anuncios | ConvertTo-Json -Depth 5) -split "`r?`n"
Write-Utf8BomText -Path $OutputJson -Lines $jsonLines

$resumoLinhas = New-Object System.Collections.Generic.List[string]
$resumoLinhas.Add("Resumo do seed de anuncios - gerado em $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")")
$resumoLinhas.Add("")
$resumoLinhas.Add("Totais gerais")
$resumoLinhas.Add("  Usuarios usados: 320")
$resumoLinhas.Add("  Anuncios totais: $($anuncios.Count)")
$resumoLinhas.Add("  Blocos de usuarios: 260 com 1 anuncio, 50 com 2 anuncios, 10 com 4 anuncios")
$resumoLinhas.Add("")
$resumoLinhas.Add("Distribuicao por cidade")

$anuncios | Group-Object cidade | Sort-Object Name | ForEach-Object {
    $resumoLinhas.Add("  $($_.Name): $($_.Count) anuncios")
}

$resumoLinhas.Add("")
$resumoLinhas.Add("Distribuicao por tipo")
$anuncios | Group-Object tipo_label | Sort-Object Name | ForEach-Object {
    $resumoLinhas.Add("  $($_.Name): $($_.Count)")
}

$resumoLinhas.Add("")
$resumoLinhas.Add("Distribuicao por condicao")
$anuncios | Group-Object condicao_label | Sort-Object Name | ForEach-Object {
    $resumoLinhas.Add("  $($_.Name): $($_.Count)")
}

$resumoLinhas.Add("")
$resumoLinhas.Add("Faixas de usuarios por cidade")
for ($cidadeIndex = 0; $cidadeIndex -lt $cidades.Count; $cidadeIndex++) {
    $inicioSingles = $cidadeIndex * 26 + 1
    $fimSingles = $inicioSingles + 25
    $inicioDuplos = 261 + ($cidadeIndex * 5)
    $fimDuplos = $inicioDuplos + 4
    $usuarioQuadruplo = 311 + $cidadeIndex

    $resumoLinhas.Add("  $($cidades[$cidadeIndex].nome):")
    $resumoLinhas.Add("    Singles: $("{0:D4}" -f $inicioSingles) ate $("{0:D4}" -f $fimSingles)")
    $resumoLinhas.Add("    Duplos:  $("{0:D4}" -f $inicioDuplos) ate $("{0:D4}" -f $fimDuplos)")
    $resumoLinhas.Add("    Quadruplo: $("{0:D4}" -f $usuarioQuadruplo)")
}

Write-Utf8BomText -Path $OutputResumo -Lines $resumoLinhas

Write-Output "CSV: $OutputCsv"
Write-Output "JSON: $OutputJson"
Write-Output "Resumo: $OutputResumo"
