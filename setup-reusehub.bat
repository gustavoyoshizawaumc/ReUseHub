@echo off
echo.
echo  Criando estrutura de pastas do ReUseHub...
echo.

:: ============================================================
::  BACKEND
:: ============================================================

set BASE=backend\src\main\java\com\reusehub

mkdir %BASE%\auth\controller
mkdir %BASE%\auth\service
mkdir %BASE%\auth\repository
mkdir %BASE%\auth\model
mkdir %BASE%\auth\dto

mkdir %BASE%\listings\controller
mkdir %BASE%\listings\service
mkdir %BASE%\listings\repository
mkdir %BASE%\listings\model
mkdir %BASE%\listings\dto

mkdir %BASE%\search\controller
mkdir %BASE%\search\service
mkdir %BASE%\search\dto

mkdir %BASE%\relevance\service
mkdir %BASE%\relevance\repository

mkdir %BASE%\chat\controller
mkdir %BASE%\chat\service
mkdir %BASE%\chat\repository
mkdir %BASE%\chat\model

mkdir %BASE%\reviews\controller
mkdir %BASE%\reviews\service
mkdir %BASE%\reviews\repository
mkdir %BASE%\reviews\model

mkdir %BASE%\shared\config
mkdir %BASE%\shared\exception
mkdir %BASE%\shared\model
mkdir %BASE%\shared\util

mkdir backend\src\main\resources
mkdir backend\src\test\java\com\reusehub\auth
mkdir backend\src\test\java\com\reusehub\listings
mkdir backend\src\test\java\com\reusehub\reviews

:: ============================================================
::  FRONTEND
:: ============================================================

mkdir frontend\src\pages\Home
mkdir frontend\src\pages\Login
mkdir frontend\src\pages\Register
mkdir frontend\src\pages\Listings
mkdir frontend\src\pages\NewListing
mkdir frontend\src\pages\Chat
mkdir frontend\src\pages\Profile
mkdir frontend\src\pages\Dashboard

mkdir frontend\src\components\ui
mkdir frontend\src\components\layout
mkdir frontend\src\components\listings
mkdir frontend\src\components\search
mkdir frontend\src\components\chat
mkdir frontend\src\components\reviews

mkdir frontend\src\services
mkdir frontend\src\hooks
mkdir frontend\src\types
mkdir frontend\src\contexts
mkdir frontend\src\utils
mkdir frontend\src\router

:: ============================================================
::  DOCS E GITHUB
:: ============================================================

mkdir docs\diagramas
mkdir docs\wireframes
mkdir .github

echo.
echo  Estrutura criada com sucesso!
echo.
pause
