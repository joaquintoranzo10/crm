from rest_framework import serializers
from .models import Propiedad, PropiedadImagen


class PropiedadImagenSerializer(serializers.ModelSerializer):
    imagen = serializers.ImageField(read_only=True)

    class Meta:
        model = PropiedadImagen
        fields = ["id", "imagen", "descripcion"]
        read_only_fields = ["id"]


class PropiedadSerializer(serializers.ModelSerializer):
    imagenes = PropiedadImagenSerializer(many=True, read_only=True)

    # 🔹 Campos con choices definidos explícitamente
    tipo_de_propiedad = serializers.ChoiceField(
        choices=Propiedad._meta.get_field("tipo_de_propiedad").choices
    )
    disponibilidad = serializers.ChoiceField(
        choices=Propiedad._meta.get_field("disponibilidad").choices
    )
    moneda = serializers.ChoiceField(
        choices=Propiedad._meta.get_field("moneda").choices
    )
    estado = serializers.ChoiceField(
        choices=Propiedad._meta.get_field("estado").choices
    )

    class Meta:
        model = Propiedad
        fields = [
            "id",
            "codigo",
            "titulo",
            "descripcion",
            "ubicacion",
            "tipo_de_propiedad",
            "disponibilidad",
            "precio",
            "moneda",
            "ambiente",
            "antiguedad",
            "banos",
            "superficie",
            "fecha_alta",
            "estado",
            "imagenes",
        ]
        read_only_fields = ["id", "fecha_alta"]


class SubirImagenesSerializer(serializers.Serializer):
    imagenes = serializers.ListField(
        child=serializers.ImageField(),
        allow_empty=False,
        required=False,
    )
    imagen = serializers.ImageField(required=False)  # por si suben solo una
    descripcion = serializers.CharField(required=False, allow_blank=True)
