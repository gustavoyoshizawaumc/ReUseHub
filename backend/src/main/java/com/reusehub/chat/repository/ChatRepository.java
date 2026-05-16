package com.reusehub.chat.repository;

import com.reusehub.chat.document.Conversa;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends MongoRepository<Conversa, String> {

    Optional<Conversa> findByRemetenteAndDestinatario(String remetente, String destinatario);

    @Query("{ $or: [ { 'remetente': ?0 }, { 'destinatario': ?0 } ] }")
    List<Conversa> findByUsuario(String usuarioId);

    @Query("{ 'destinatario': ?0, 'lido': false }")
    List<Conversa> findNaoLidasPorDestinatario(String destinatario);

    @Query("""
    {
    'anuncioId': ?0,
    '$or': [
        { 'remetente': ?1, 'destinatario': ?2 },
        { 'remetente': ?2, 'destinatario': ?1 }
    ]
    }
    """)
    Optional<Conversa> findByAnuncioIdAndUsuarios(String anuncioId, String usuarioA, String usuarioB);
}