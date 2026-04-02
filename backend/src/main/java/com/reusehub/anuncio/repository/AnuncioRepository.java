package com.reusehub.anuncio.repository;


import com.reusehub.anuncio.model.Anuncio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AnuncioRepository extends JpaRepository<Anuncio, UUID> {


}
