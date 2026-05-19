package com.reusehub.auth.service;

import com.reusehub.anuncio.exception.OperacaoInvalidaException;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String gerarToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getChave())
                .compact();
    }

    public boolean tokenValido(String token, UserDetails userDetails) {
        try {
            return extrairEmail(token).equals(userDetails.getUsername()) && !tokenExpirado(token);
        } catch (OperacaoInvalidaException e) {
            return false;
        }
    }

    public String extrairEmail(String token) {
        return extrairClaim(token, Claims::getSubject);
    }

    private boolean tokenExpirado(String token) {
        return extrairClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extrairClaim(String token, Function<Claims, T> resolver) {
        try {
            return resolver.apply(
                Jwts.parser().verifyWith(getChave()).build().parseSignedClaims(token).getPayload()
            );
        } catch (ExpiredJwtException e) {
            throw new OperacaoInvalidaException("O token enviado está expirado.");
        } catch (UnsupportedJwtException | MalformedJwtException | SignatureException e) {
            throw new OperacaoInvalidaException("Token JWT inválido ou assinatura corrompida.");
        } catch (IllegalArgumentException e) {
            throw new OperacaoInvalidaException("As claims do token estão vazias.");
        }
    }

    private SecretKey getChave() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}