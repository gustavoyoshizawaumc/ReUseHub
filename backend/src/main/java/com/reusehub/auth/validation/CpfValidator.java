package com.reusehub.auth.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CpfValidator implements ConstraintValidator<ValidCpf, String> {

    private static final int TAMANHO_CPF = 11;

    @Override
    public boolean isValid(String cpf, ConstraintValidatorContext context) {
        if (cpf == null || cpf.isBlank()) {
            return false;
        }

        String cpfLimpo = cpf.replaceAll("[^0-9]", "");

        if (cpfLimpo.length() != TAMANHO_CPF) {
            return false;
        }

        if (todosDigitosIguais(cpfLimpo)) {
            return false;
        }

        return primeiroDigitoValido(cpfLimpo) && segundoDigitoValido(cpfLimpo);
    }

    private boolean todosDigitosIguais(String cpf) {
        return cpf.chars().distinct().count() == 1;
    }

    private boolean primeiroDigitoValido(String cpf) {
        int digitoEsperado = calcularDigitoVerificador(cpf, 9, 10);
        return (cpf.charAt(9) - '0') == digitoEsperado;
    }

    private boolean segundoDigitoValido(String cpf) {
        int digitoEsperado = calcularDigitoVerificador(cpf, 10, 11);
        return (cpf.charAt(10) - '0') == digitoEsperado;
    }

    private int calcularDigitoVerificador(String cpf, int quantidadeDigitos, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < quantidadeDigitos; i++) {
            soma += (cpf.charAt(i) - '0') * (pesoInicial - i);
        }
        int resto = soma % 11;
        return (resto < 2) ? 0 : (11 - resto);
    }
}
